export interface User {
  id: string;
  username: string;
}

export const mockUsers: User[] = [
  { id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890", username: "admin" },
  { id: "u2b3c4d5-e6f7-8901-bcde-f12345678901", username: "john.doe" },
  { id: "u3c4d5e6-f7a8-9012-cdef-123456789012", username: "jane.smith" },
];
