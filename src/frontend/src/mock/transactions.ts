export type TransactionType = "Income" | "Expense";

export interface Transaction {
  id: string;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  value: number;
  eventDate: string;
}

export const mockTransactions: Transaction[] = [
  {
    id: "t1a2b3c4-d5e6-7890-abcd-ef1234567890",
    categoryId: "c7a8b9c0-d1e2-3456-abcd-567890123456",
    categoryName: "Salary",
    type: "Income",
    value: 5000.0,
    eventDate: "2026-04-01",
  },
  {
    id: "t2b3c4d5-e6f7-8901-bcde-f12345678901",
    categoryId: "c8b9c0d1-e2f3-4567-bcde-678901234567",
    categoryName: "Freelance",
    type: "Income",
    value: 1200.0,
    eventDate: "2026-04-05",
  },
  {
    id: "t3c4d5e6-f7a8-9012-cdef-123456789012",
    categoryId: "c2b3c4d5-e6f7-8901-bcde-f12345678901",
    categoryName: "Rent",
    type: "Expense",
    value: 1500.0,
    eventDate: "2026-04-01",
  },
  {
    id: "t4d5e6f7-a8b9-0123-defa-234567890123",
    categoryId: "c1a2b3c4-d5e6-7890-abcd-ef1234567890",
    categoryName: "Groceries",
    type: "Expense",
    value: 320.5,
    eventDate: "2026-04-03",
  },
  {
    id: "t5e6f7a8-b9c0-1234-efab-345678901234",
    categoryId: "c3c4d5e6-f7a8-9012-cdef-123456789012",
    categoryName: "Utilities",
    type: "Expense",
    value: 180.0,
    eventDate: "2026-04-05",
  },
  {
    id: "t6f7a8b9-c0d1-2345-fabc-456789012345",
    categoryId: "c4d5e6f7-a8b9-0123-defa-234567890123",
    categoryName: "Transportation",
    type: "Expense",
    value: 75.0,
    eventDate: "2026-04-07",
  },
  {
    id: "t7a8b9c0-d1e2-3456-abcd-567890123456",
    categoryId: "c5e6f7a8-b9c0-1234-efab-345678901234",
    categoryName: "Entertainment",
    type: "Expense",
    value: 120.0,
    eventDate: "2026-04-10",
  },
  {
    id: "t8b9c0d1-e2f3-4567-bcde-678901234567",
    categoryId: "c6f7a8b9-c0d1-2345-fabc-456789012345",
    categoryName: "Healthcare",
    type: "Expense",
    value: 250.0,
    eventDate: "2026-04-12",
  },
];
