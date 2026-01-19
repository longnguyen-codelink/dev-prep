// orderService.ts
import fs from "fs";
import fetch from "node-fetch";

export type User = { name: string; ordersCount: number };
type OrderItem = {
	sku: string;
	qty: number;
	price: number;
};

export type Order = {
	id: string;
	userId: string;
	items: OrderItem[];
	coupon?: string | null;
	createdAt?: Date | string;
};

// Question: what's the purpose of this global var

export class OrderService {
	constructor(private lastTotal: number = 0) {}

	public async processOrder(order: Order, processedAt = new Date()): Promise<number> {
		console.log("Processing order", order);

		order.createdAt = processedAt.toISOString(); // Date should be pass in as param

		// to user
		const user = await getUser(order.userId, process.env.API_URL);

		// Get Tax
		const tax = getTax({ items: order.items, coupon: order.coupon, ordersCount: user.ordersCount, processedAt });

		// Write file
		await writeReceipt(`${order.id}.txt`, `User:${user.name}\\nTotal:${tax.toFixed(2)}`);
		this.lastTotal = tax;
		console.log("Done", this.lastTotal);

		return tax;
	}

	public getLastTotal() {
		return this.lastTotal;
	}
}

// utils/writeResult.ts
const writeFolder = "./receipts";
export async function writeReceipt(fileName: string, data: string) {
	if (!fs.existsSync(writeFolder)) {
		console.log("No receipt folder, creating receipt folder");
		await fs.promises.mkdir(writeFolder);
	}

	const filePath = `${writeFolder}/${fileName}`;
	return fs.promises.writeFile(filePath, data);
}

// Create get discount function
// utils/getDiscount.ts
export enum DiscountSubTotalRate {
	WELCOME_RATE = 0.15,
	VIP_RATE = 0.1, // With max 50
}

type GetDiscountProps = { coupon: Order["coupon"]; subtotal: number; ordersCount: User["ordersCount"]; processedAt?: Date };
export function getDiscount(props: GetDiscountProps) {
	const { coupon, subtotal, ordersCount, processedAt = new Date() } = props;

	if (coupon === "WELCOME" && ordersCount === 0) return subtotal * DiscountSubTotalRate.WELCOME_RATE;

	if (coupon && coupon.startsWith("VIP")) return Math.min(50, subtotal * DiscountSubTotalRate.VIP_RATE);

	if (processedAt.getDay() === 2) return 5;

	return 0;
}

// utils/getUser.ts
export async function getUser(userId: Order["userId"], url: string | null | undefined): Promise<User> {
	if (!url) throw new Error("Invalid URL");

	if (!userId) throw new Error("User id is null or empty");

	const userResp = await fetch(`${url}/users/${userId}`);
	const user = await userResp.json();
	return <User>user; // Typecast, could be better (Zod?)
}

// utils/getTax.ts
export enum TaxRate {
	DEFAULT = "0.2",
}
type GetTaxProps = { items: Order["items"]; coupon: Order["coupon"]; ordersCount: User["ordersCount"]; processedAt: Date };
export function getTax(props: GetTaxProps) {
	const { items, coupon, ordersCount, processedAt } = props;

	const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
	const discount = getDiscount({ coupon, ordersCount, processedAt, subtotal });
	const taxRate = Number(process.env.TAX_RATE || TaxRate.DEFAULT); // Tax rate
	const tax = (subtotal - discount) * (1 + taxRate);

	if (tax < 0) throw new Error("Calculated tax is less than 0");

	return tax;
}
