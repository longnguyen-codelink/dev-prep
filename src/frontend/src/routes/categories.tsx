import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import Plus from "lucide-react/dist/esm/icons/plus.js"
import Pencil from "lucide-react/dist/esm/icons/pencil.js"
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { PageHeader } from "@/components/PageHeader"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getGetCategoriesQueryKey,
} from "@/api/generated/category/category"
import type { CategoryListDTO } from "@/api/generated/model/categoryListDTO"

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
})

function CategoriesPage() {
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useGetCategories() as { data: CategoryListDTO[] | undefined; isLoading: boolean }
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [name, setName] = useState("")

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() })

  const openAdd = () => {
    setEditingId(null)
    setName("")
    setFormOpen(true)
  }

  const openEdit = (cat: CategoryListDTO) => {
    setEditingId(cat.id!)
    setName(cat.name ?? "")
    setFormOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const isPending = createCategory.isPending || updateCategory.isPending

  const handleSave = () => {
    if (!name.trim()) return

    if (editingId) {
      updateCategory.mutate(
        { id: editingId, data: { name: name.trim() } },
        { onSuccess: () => { invalidate(); setFormOpen(false) } }
      )
    } else {
      createCategory.mutate(
        { data: { name: name.trim() } },
        { onSuccess: () => { invalidate(); setFormOpen(false) } }
      )
    }
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteCategory.mutate(
        { id: deletingId },
        { onSuccess: () => { invalidate(); setDeletingId(null) } }
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage your expense and income categories"
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />

      <div className="rounded-md border">
        {isLoading ? (
          <p className="h-24 flex items-center justify-center text-sm text-muted-foreground">
            Loading categories…
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!categories?.length ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No categories yet.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(cat.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the category name below."
                : "Enter a name for the new category."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving…" : editingId ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />
    </div>
  )
}
