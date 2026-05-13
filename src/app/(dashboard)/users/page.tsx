"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, getInitials, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  UserCog,
  Mail,
  Phone,
  Shield,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  joiningDate: string | null;
  createdAt: string;
}

const ROLES = [
  { value: "DIRECTOR", label: "Director", color: "bg-indigo-100 text-indigo-800" },
  { value: "GENERAL_MANAGER", label: "General Manager", color: "bg-purple-100 text-purple-800" },
  { value: "ADMIN", label: "Administrator", color: "bg-red-100 text-red-800" },
  { value: "AGENT", label: "Agent", color: "bg-blue-100 text-blue-800" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const isAdminOrDirector = currentUser?.role === "ADMIN" || currentUser?.role === "DIRECTOR" || currentUser?.role === "GENERAL_MANAGER";
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "AGENT",
    joiningDate: new Date().toISOString().split('T')[0],
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setCurrentUser(d.user)).catch(() => { });
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setDialogOpen(false);
        setNewUser({
          email: "",
          firstName: "",
          lastName: "",
          phone: "",
          role: "AGENT",
          joiningDate: new Date().toISOString().split('T')[0],
          password: "",
          confirmPassword: "",
        });
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("An unexpected error occurred while creating the user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          phone: editingUser.phone,
          role: editingUser.role,
          joiningDate: editingUser.joiningDate,
          isActive: editingUser.isActive
        }),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
         const data = await res.json();
         alert(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      } else {
         const data = await res.json();
         alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const getRoleConfig = (role: string) => {
    return ROLES.find((r) => r.value === role) || ROLES.find((r) => r.value === "AGENT")!;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage system users and access</p>
        </div>
        {isAdminOrDirector && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger label="Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter(r => currentUser?.role === "DIRECTOR" || (!["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(r.value))).map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  label="Joining Date"
                  type="date"
                  value={newUser.joiningDate || ""}
                  onChange={(e) => setNewUser({ ...newUser, joiningDate: e.target.value })}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Modify user details and roles
                </DialogDescription>
              </DialogHeader>
              {editingUser && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={editingUser.firstName}
                      onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={editingUser.lastName}
                      onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label="Phone"
                    type="tel"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                  <Select
                    value={editingUser.role}
                    onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                  >
                    <SelectTrigger label="Role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter(r => currentUser?.role === "DIRECTOR" || (!["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(r.value))).map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    label="Joining Date"
                    type="date"
                    value={editingUser.joiningDate || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, joiningDate: e.target.value })}
                  />
                  <label className="flex items-center space-x-2 text-sm pt-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={editingUser.isActive}
                      onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})} 
                    />
                    <span>User Account Active</span>
                  </label>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingUser(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

      {/* Role Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {ROLES.map((role) => (
          <Card key={role.value}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{role.label}s</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.role === role.value).length}
                  </p>
                </div>
                <div className={`rounded-full p-2 ${role.color}`}>
                  <Shield className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">All Users</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-9 w-full sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCog className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-gray-500">Add your first user to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  {isAdminOrDirector && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "success" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {user.joiningDate ? formatDate(user.joiningDate) : "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}
                      </TableCell>
                      {isAdminOrDirector && (
                        <TableCell className="text-right">
                          {(currentUser?.role === "DIRECTOR" || (!["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role))) && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setEditingUser(user); setEditDialogOpen(true); }}
                                className="mr-2 text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
