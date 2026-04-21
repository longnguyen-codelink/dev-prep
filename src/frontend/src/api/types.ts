export interface LoginResponse {
  authCode: string
}

export interface TokenResponse {
  accessToken: string
}

export interface RoleOption {
  label: string
  value: string
}

export interface TransactionSummaryResponse {
  totalIncome: number
  totalExpense: number
  netBalance: number
}
