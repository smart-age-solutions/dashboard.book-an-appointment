import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Shield, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

const initialUsers: UserData[] = [];

const roleStyles: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  manager: "bg-warning/10 text-warning border-warning/20",
  staff: "bg-muted text-muted-foreground border-border",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff",
    status: "active",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, teamData] = await Promise.all([
        api.get("/teams/all-members"),
        api.get("/teams")
      ]);
      setUsers(userData.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        lastActive: u.created_at ? "Joined " + new Date(u.created_at).toLocaleDateString() : "Never",
      })));
      setTeams(teamData.teams);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingUser) {
        // Only role can be updated in the existing API for now
        await api.put(`/teams/members/${editingUser.id}/role`, { role: formData.role });
        toast({ title: "Updated", description: "User role updated successfully" });
      } else {
        // Need a team to invite. If no team, create one first.
        let teamId = teams[0]?.id;
        if (!teamId) {
          const newTeam = await api.post("/teams", { name: "Default Team" });
          teamId = newTeam.team.id;
        }
        await api.post(`/teams/${teamId}/invite`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        toast({ title: "Invited", description: "Invitation sent successfully" });
      }
      fetchUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/teams/members/${id}`);
      toast({ title: "Deleted", description: "User deleted successfully" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openNewUser = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "staff", status: "active" });
    setIsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="mt-1 text-muted-foreground">
              Manage team members and their permissions
            </p>
          </div>
          <Button onClick={openNewUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <LoadingSpinner size={48} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-xl bg-card p-6 card-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn("capitalize", roleStyles[user.role])}>
                    {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                    {user.role}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                    <span className="text-xs text-muted-foreground">{user.lastActive}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "New User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  {editingUser ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
