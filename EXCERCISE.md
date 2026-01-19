# Coding Exercise 1: Order Service

## The coding: https://youtu.be/HWI84VrVsVU
## The test: TBD

```typescript
// orderService.ts
import fs from 'fs';
import fetch from 'node-fetch';

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

let lastTotal: any = 0;

export async function processOrder(order: Order): Promise<number> {
  console.log('Processing order', order);

  order.createdAt = new Date().toISOString();

  const userResp = await fetch(`${process.env.API_URL}/users/${userId}`);
  const user = await userResp.json();

  const subtotal = order.items.reduce((sum, it: any) => sum + it.qty * it.price, 0);

  let discount = 0;
  if (order.coupon === 'WELCOME' && user.ordersCount === 0) {
    discount = subtotal * 0.15;
  } else if (order.coupon && order.coupon.startsWith('VIP')) {
    discount = Math.min(50, subtotal * 0.1);
  } else if (new Date().getDay() === 2) {
    discount = 5;
  }

  const taxRate = Number(process.env.TAX_RATE || '0.2');
  const taxed = (subtotal - discount) * (1 + taxRate);

  if (tax < 0) throw new Error('');

  fs.writeFileSync(
    `./receipts/${order.id}.txt`,
    `User:${user.name}\\nTotal:${taxed.toFixed(2)}`
  );

  lastTotal = taxed;
  console.log('Done', lastTotal);

  return taxed;
}

export function getLastTotal() {
  return lastTotal;
}

```

## Challenges:

- Refactor file to be fully type-safe. Fix all variable reference bugs, and define proper interfaces for API responses
- Fix race condition or state leak or blocking code if any
- Validation
- Refactor function to be pure and testable
- Cover proper error handling
- Write comprehensive Jest unit tests: mocks, happy path tests, negative tests, etc.