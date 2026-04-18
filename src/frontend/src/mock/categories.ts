export interface Category {
  id: string;
  name: string;
}

export const mockCategories: Category[] = [
  { id: "c1a2b3c4-d5e6-7890-abcd-ef1234567890", name: "Groceries" },
  { id: "c2b3c4d5-e6f7-8901-bcde-f12345678901", name: "Rent" },
  { id: "c3c4d5e6-f7a8-9012-cdef-123456789012", name: "Utilities" },
  { id: "c4d5e6f7-a8b9-0123-defa-234567890123", name: "Transportation" },
  { id: "c5e6f7a8-b9c0-1234-efab-345678901234", name: "Entertainment" },
  { id: "c6f7a8b9-c0d1-2345-fabc-456789012345", name: "Healthcare" },
  { id: "c7a8b9c0-d1e2-3456-abcd-567890123456", name: "Salary" },
  { id: "c8b9c0d1-e2f3-4567-bcde-678901234567", name: "Freelance" },
];
