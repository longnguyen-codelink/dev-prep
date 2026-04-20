import { useState, type FormEvent } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import Plus from "lucide-react/dist/esm/icons/plus.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { useGetUsers, useGetAllRoles, useCreateUser, getGetUsersQueryKey } from "@/api/generated/user/user"
import type { User } from "@/api/generated/model/user"
import type { UserRole } from "@/api/generated/model/userRole"
import type { RoleOption } from "@/api/types"

export const Route = createFileRoute("/admin")({
  component: AdminPage,
})

function AdminPage() {
  const queryClient = useQueryClient()
  const { data: users, isLoading: usersLoading } = useGetUsers() as { data: User[] | undefined; isLoading: boolean }
  const { data: roles } = useGetAllRoles() as { data: RoleOption[] | undefined }
  const createUser = useCreateUser()

  const [formOpen, setFormOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState<string | null>(null)

  const openAdd = () => {
    setUsername("")
    setPassword("")
    setRole(roles?.[0]?.value ?? "")
    setError(null)
    setFormOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    createUser.mutate(
      { data: { username: username.trim(), password: password.trim(), role: Number(role) as UserRole } },
      {
        onSuccess: () => {
          setFormOpen(false)
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() })
        },
        onError: (err) => {
          const message =
            err instanceof Error ? err.message : "Failed to create user. You may not have admin privileges."
          setError(message)
        },
      }
    )
  }

  const getRoleLabel = (roleValue: number) => {
    const match = roles?.find((r) => r.value === String(roleValue))
    return match?.label ?? String(roleValue)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Manage users and roles"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              All registered users in the system
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleLabel(user.role) === "Admin" ? "default" : "secondary"}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>Add a new user to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={createUser.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createUser.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={createUser.isPending}>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
