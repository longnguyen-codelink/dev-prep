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
import { PageHeader } from "@/components/PageHeader"
import { mockSummary } from "@/mock/summary"
import { mockTransactions } from "@/mock/transactions"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  const recentTransactions = mockTransactions.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your financial data"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${mockSummary.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
              ${mockSummary.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
              ${mockSummary.netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                  <TableCell>{tx.eventDate}</TableCell>
                  <TableCell>{tx.categoryName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.type === "Income" ? "default" : "destructive"
                      }
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${tx.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
