jest.mock("node-fetch", () => jest.fn());
import fetch, { Response } from "node-fetch";
import { OrderService } from "./orderService";

import type { Order, User } from "./orderService";

describe("Order Service Test", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	test("Happy case", async () => {
		process.env.API_URL = "https://mockapi.com";
		const mockedUserResponse: User = {
			name: "Test account",
			ordersCount: 5,
		};
		(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(<Response>{
			status: 200,
			statusText: "Sucess",
			json: async () => mockedUserResponse,
		});

		const order: Order = {
			id: "1",
			userId: "1",
			items: [{ sku: "1", qty: 1, price: 100 }],
		};
		const orderService = new OrderService();

		await expect(orderService.processOrder(order)).resolves.toBe(120);
	});

	test("Should reject with no url in env", async () => {
		const order: Order = {
			id: "1",
			userId: "1",
			items: [{ sku: "1", qty: 1, price: 100 }],
		};
		const orderService = new OrderService();

		await expect(orderService.processOrder(order)).rejects.toThrow("Invalid URL");
	});

	test("Should reject with no user Id", async () => {
		process.env.API_URL = "https://mockapi.com";

		const order: Order = {
			id: "1",
			userId: "",
			items: [{ sku: "1", qty: 1, price: 100 }],
		};
		const orderService = new OrderService();

		await expect(orderService.processOrder(order)).rejects.toThrow("User id is null or empty");
	});

	test("Should reject because tax is less than 0", async () => {
		process.env.API_URL = "https://mockapi.com";
		const mockedUserResponse: User = {
			name: "Test account",
			ordersCount: -1,
		};
		(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(<Response>{
			status: 200,
			statusText: "Sucess",
			json: async () => mockedUserResponse,
		});

		const order: Order = {
			id: "1",
			userId: "1",
			items: [{ sku: "1", qty: 1, price: -2 }],
		};
		const orderService = new OrderService();

		await expect(orderService.processOrder(order)).rejects.toThrow("Calculated tax is less than 0");
	});
});
