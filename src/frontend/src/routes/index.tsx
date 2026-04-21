import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign.js"
import TrendingDown from "lucide-react/dist/esm/icons/trending-down.js"
import TrendingUp from "lucide-react/dist/esm/icons/trending-up.js"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/PageHeader"
import { useGetTransactions } from "@/api/generated/transaction/transaction"
import { useGetTransactionSummary } from "@/api/generated/transaction/transaction"
import { useGetCategories } from "@/api/generated/category/category"
import type { Transaction } from "@/api/generated/model/transaction"
import { TransactionType } from "@/api/generated/model/transactionType"
import type { TransactionSummaryResponse } from "@/api/types"

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000"

const TYPE_LABEL: Record<number, string> = {
  [TransactionType.NUMBER_0]: "Income",
  [TransactionType.NUMBER_1]: "Expense",
}

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(EMPTY_GUID)

  const { data: categoriesRaw } = useGetCategories()
  const categories = categoriesRaw as unknown as { id?: string; name: string | null }[]

  const categoryOptions = [
    { id: EMPTY_GUID, name: "All" },
    ...(categories ?? []),
  ]

  const summaryParams =
    selectedCategoryId && selectedCategoryId !== EMPTY_GUID
      ? { categoryId: selectedCategoryId }
      : {}
  const { data: summaryRaw } = useGetTransactionSummary(summaryParams)
  const summary = summaryRaw as unknown as TransactionSummaryResponse

  const { data: transactionsRaw } = useGetTransactions({ PageSize: 5 })
  const recentTransactions = (transactionsRaw as unknown as Transaction[]) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your financial data"
      />

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by category:</span>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat.id ?? EMPTY_GUID} value={cat.id ?? EMPTY_GUID}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${(summary?.totalIncome ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <CardDescription>All income this period</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(summary?.totalExpense ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <CardDescription>All expenses this period</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(summary?.netBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <CardDescription>Income minus expenses</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest 5 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {tx.eventDate
                      ? new Date(tx.eventDate).toLocaleDateString("en-US")
                      : "—"}
                  </TableCell>
                  <TableCell>{tx.category?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.type === TransactionType.NUMBER_0 ? "default" : "destructive"
                      }
                    >
                      {tx.type != null ? TYPE_LABEL[tx.type] : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${(tx.value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
