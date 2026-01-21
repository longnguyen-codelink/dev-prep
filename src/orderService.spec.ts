jest.mock("node-fetch", () => jest.fn());
import fetch, { Response } from "node-fetch";
import { OrderService } from "./orderService";

import type { Order, User } from "./orderService";

function mockFetchUserSuccess(fetchFn: typeof fetch, userData: User) {
	const mockFetch = fetchFn as jest.MockedFunction<typeof fetch>;
	mockFetch.mockResolvedValueOnce(<Response>{ status: 200, statusText: "Sucess", json: async () => userData });
}

describe("OrderService", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("processOrder()", () => {
		describe("when no coupon is provided", () => {
			it("should calculate the total based on subtotal and default tax", async () => {
				process.env.API_URL = "https://mockapi.com";
				const mockedUserResponse: User = { name: "Test account", ordersCount: 5 };
				mockFetchUserSuccess(fetch, mockedUserResponse);

				const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }] };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order)).resolves.toBe(120);
			});
		});

		describe("when using the WELCOME coupon", () => {
			it("should apply 15% discount if it is the users first order", async () => {
				process.env.API_URL = "https://mockapi.com";
				const mockedUserResponse: User = { name: "New User", ordersCount: 0 };
				mockFetchUserSuccess(fetch, mockedUserResponse);

				const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }], coupon: "WELCOME" };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order)).resolves.toBe(102);
			});

			it("should apply no discount if the user has previous orders", async () => {
				process.env.API_URL = "https://mockapi.com";
				const mockedUserResponse: User = { name: "Returning User", ordersCount: 3 };
				mockFetchUserSuccess(fetch, mockedUserResponse);

				const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }], coupon: "WELCOME" };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order)).resolves.toBe(120);
			});
		});

		describe("when it is a Tuesday", () => {
			it("should apply a flat 5 unit discoxunt regardless of coupon", async () => {
				const tuesdayDate = "2024-01-02T10:00:00Z"; // This date is a Tuesday

				process.env.API_URL = "https://mockapi.com";
				const mockedUserResponse: User = { name: "Any User", ordersCount: 10 };
				mockFetchUserSuccess(fetch, mockedUserResponse);

				const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }], coupon: "VIP" };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order, new Date(tuesdayDate))).resolves.toBe(114); // 100 - 5 + tax
			});
		});

		describe("receipt handling", () => {
			it("should save a receipt file to the local disk", async () => {
				process.env.API_URL = "https://mockapi.com";
				const mockedUserResponse: User = { name: "Receipt User", ordersCount: 2 };
				mockFetchUserSuccess(fetch, mockedUserResponse);

				const order: Order = { id: "receipt_test", userId: "1", items: [{ sku: "1", qty: 1, price: 50 }] };
				const orderService = new OrderService();
				await orderService.processOrder(order);

				const fs = await import("fs");
				const receiptPath = `./receipts/${order.id}.txt`;
				const fileExists = fs.existsSync(receiptPath);
				expect(fileExists).toBe(true);

				if (fileExists) await fs.promises.unlink(receiptPath); // Clean up after test
			});
		});

		describe("error handling", () => {
			it("should throw an error if the user API is unreachable", async () => {
				process.env.API_URL = "https://unreachable.com";

				const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
				mockFetch.mockResolvedValueOnce(<Response>{ status: 500, statusText: "Internal Server Error" });

				const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }] };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order)).rejects.toThrow("Failed to fetch user data: 500 Internal Server Error");
			});

			it("should fail if the calculated tax results in a negative number", async () => {
				process.env.API_URL = "https://mockapi.com";
				const mockedUserResponse: User = { name: "Test account", ordersCount: -1 };
				mockFetchUserSuccess(fetch, mockedUserResponse);

				const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: -2 }] };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order)).rejects.toThrow("Calculated tax is less than 0");
			});

			it("should throw an error when userId is null or empty", async () => {
				process.env.API_URL = "https://mockapi.com";

				const order: Order = { id: "1", userId: "", items: [{ sku: "1", qty: 1, price: 100 }] };
				const orderService = new OrderService();

				await expect(orderService.processOrder(order)).rejects.toThrow("User id is null or empty");
			});

			describe("environment variables", () => {
				it("should throw an error if API_URL is not set", async () => {
					const order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }] };
					const orderService = new OrderService();

					await expect(orderService.processOrder(order)).rejects.toThrow("Invalid URL");
				});

				it("should default to the default tax rate, 0.2, if TAX_RATE is not set", async () => {
					process.env.API_URL = "https://mockapi.com";
					const mockedUserResponse: User = { name: "Test account", ordersCount: 5 };
					mockFetchUserSuccess(fetch, mockedUserResponse);

					let order: Order = { id: "1", userId: "1", items: [{ sku: "1", qty: 1, price: 100 }] };
					const orderService = new OrderService();

					await expect(orderService.processOrder(order)).resolves.toBe(120);

					mockFetchUserSuccess(fetch, mockedUserResponse);
					order = { id: "2", userId: "1", items: [{ sku: "2", qty: 1, price: 50 }] };
					await expect(orderService.processOrder(order)).resolves.toBe(60);
				});
			});
		});
	});
});
