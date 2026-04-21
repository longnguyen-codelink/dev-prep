import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import Plus from "lucide-react/dist/esm/icons/plus.js"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/PageHeader"
import {
  useGetTransactions,
  useCreateTransaction,
  getGetTransactionsQueryKey,
} from "@/api/generated/transaction/transaction"
import { useGetCategories } from "@/api/generated/category/category"
import type { Transaction } from "@/api/generated/model/transaction"
import type { CategoryListDTO } from "@/api/generated/model/categoryListDTO"
import { TransactionType } from "@/api/generated/model/transactionType"

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
})

interface FormData {
  categoryId: string
  type: string
  amount: string
  date: string
}

const emptyForm: FormData = {
  categoryId: "",
  type: String(TransactionType.NUMBER_0),
  amount: "",
  date: new Date().toISOString().split("T")[0],
}

const TYPE_LABEL: Record<number, string> = {
  [TransactionType.NUMBER_0]: "Expense",
  [TransactionType.NUMBER_1]: "Income",
}

function TransactionsPage() {
  const queryClient = useQueryClient()
  const { data: transactions, isLoading } = useGetTransactions() as { data: Transaction[] | undefined; isLoading: boolean }
  const { data: categories } = useGetCategories() as { data: CategoryListDTO[] | undefined }
  const createTransaction = useCreateTransaction()

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() })

  const openAdd = () => {
    setForm({
      ...emptyForm,
      categoryId: categories?.[0]?.id ?? "",
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!form.categoryId || !form.amount || !form.date) return

    createTransaction.mutate(
      {
        data: {
          categoryId: form.categoryId,
          type: Number(form.type) as TransactionType,
          amount: parseFloat(form.amount),
          date: form.date,
        },
      },
      {
        onSuccess: () => {
          invalidate()
          setFormOpen(false)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and manage your financial transactions"
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        }
      />

      <div className="rounded-md border">
        {isLoading ? (
          <p className="h-24 flex items-center justify-center text-sm text-muted-foreground">
            Loading transactions…
          </p>
        ) : (
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
              {!transactions?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.eventDate}</TableCell>
                    <TableCell>{tx.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.type === TransactionType.NUMBER_1 ? "default" : "destructive"
                        }
                      >
                        {TYPE_LABEL[tx.type ?? TransactionType.NUMBER_0]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(tx.value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Fill in the details for the new transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                disabled={createTransaction.isPending}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id!}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                disabled={createTransaction.isPending}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(TransactionType.NUMBER_0)}>Expense</SelectItem>
                  <SelectItem value={String(TransactionType.NUMBER_1)}>Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                disabled={createTransaction.isPending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                disabled={createTransaction.isPending}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={createTransaction.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createTransaction.isPending}>
              {createTransaction.isPending ? "Adding…" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
