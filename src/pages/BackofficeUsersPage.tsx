import { useState, useEffect, useCallback, useMemo } from "react";
import { UserCog, Plus, Search, Trash2, Building2, ShieldAlert, ArrowRightCircle, CheckCircle2, XCircle, MoreHorizontal, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  is_active: boolean;
  client_id: string;
  client_name: string;
  created_at: string;
}

interface BackofficeStaff {
  id: string;
  name: string;
  email: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

interface ClientOption {
  id: string;
  companyName: string;
}

function UserAvatar({ name, colorClass = "bg-blue-500" }: { name: string; colorClass?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${colorClass} text-white text-xs font-bold shrink-0`}>
      {initials || "??"}
    </div>
  );
}

export default function BackofficeUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "staff" ? "staff" : "tenants";

  const { toast } = useToast();

  // Tenants State
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({ clientId: "", name: "", email: "", password: "", role: "member" });

  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState<GlobalUser | null>(null);
  const [promotePassword, setPromotePassword] = useState("");

  // Staff State
  const [staff, setStaff] = useState<BackofficeStaff[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(true);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

  // ——— Fetching ———

  const fetchTenants = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const [clientsData, usersData] = await Promise.all([
        api.get("/backoffice/clients"),
        api.get("/backoffice/users?per_page=500")
      ]);
      setClients(clientsData.clients.map((c: any) => ({ id: c.id, companyName: c.company_name })));
      setUsers(usersData.users);
    } catch (error: any) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } finally {
      setIsUsersLoading(false);
    }
  }, [toast]);

  const fetchStaff = useCallback(async () => {
    setIsStaffLoading(true);
    try {
      const data = await api.get("/backoffice/staff");
      setStaff(data.staff);
    } catch (error: any) {
      toast({ title: "Error loading staff", description: error.message, variant: "destructive" });
    } finally {
      setIsStaffLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "tenants") fetchTenants();
    else fetchStaff();
  }, [activeTab, fetchTenants, fetchStaff]);

  // ——— Tenants Logic ———

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.client_name?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.clientId || !newUser.name || !newUser.email || !newUser.password) return;
    setIsCreating(true);
    try {
      await api.post("/backoffice/users", { client_id: newUser.clientId, name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role });
      toast({ title: "Success", description: "User created successfully." });
      setIsCreateOpen(false);
      setNewUser({ clientId: "", name: "", email: "", password: "", role: "member" });
      fetchTenants();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this tenant user?")) return;
    try {
      await api.delete(`/backoffice/users/${userId}`);
      toast({ title: "Deleted", description: "User deleted successfully." });
      setUsers(users.filter(u => u.id !== userId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToPromote || !promotePassword) return;
    setIsCreating(true);
    try {
      await api.post("/backoffice/staff/promote", {
        email: userToPromote.email,
        name: userToPromote.name,
        password: promotePassword,
      });
      toast({ title: "Successfully Promoted", description: `${userToPromote.name} can now log in as backoffice staff.` });
      setIsPromoteOpen(false);
      setPromotePassword("");
      setSearchParams({ tab: "staff" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };


  // ——— Staff Logic ———

  const filteredStaff = useMemo(() => {
    return staff.filter(s => s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || s.email.toLowerCase().includes(staffSearchQuery.toLowerCase()));
  }, [staff, staffSearchQuery]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post("/backoffice/staff/create", newStaff);
      toast({ title: "Staff Created", description: "Backoffice user created successfully." });
      setIsCreateStaffOpen(false);
      setNewStaff({ name: "", email: "", password: "" });
      fetchStaff();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStaff = async (staffId: string) => {
    try {
      await api.post(`/backoffice/staff/${staffId}/toggle`);
      toast({ title: "Status Updated", description: `Staff member access toggled.` });
      fetchStaff();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to permanently delete this backoffice user?")) return;
    try {
      await api.delete(`/backoffice/staff/${staffId}`);
      toast({ title: "Deleted", description: "Staff member deleted." });
      setStaff(staff.filter(s => s.id !== staffId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-orange-600/10">
                <UserCog className="h-5 w-5 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Global Auth & Users</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-[52px]">
              Manage tenant users across clients or configure backoffice platform staff.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "tenants" ? (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tenant User
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsCreateStaffOpen(true)}>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setSearchParams({ tab: "tenants" })}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "tenants" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tenant Users (Client Apps)
          </button>
          <button
            onClick={() => setSearchParams({ tab: "staff" })}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "staff" ? "border-orange-500 text-orange-500" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Backoffice Staff
          </button>
        </div>

        {/* ─── TAB: TENANT USERS ─── */}
        {activeTab === "tenants" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenant users..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[300px]">User</TableHead>
                    <TableHead>Client Workspace</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUsersLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><div className="h-6 w-full rounded bg-muted animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <UserCog className="h-8 w-8 mx-auto opacity-20 mb-2" />
                        No target users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.name} />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm flex items-center gap-2">
                                {user.name}
                                {user.email.endsWith("@smartagesolutions.com") && (
                                  <Badge className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] px-1 py-0 h-4">
                                    SMARTAGE
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {user.client_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize border ${
                            user.role === 'owner' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                            user.role === 'admin' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                            "bg-muted text-muted-foreground border-transparent"
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 w-fit px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-500/10 w-fit px-2 py-0.5 rounded border border-rose-500/20">
                              <XCircle className="h-3 w-3" /> Inactive
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              {user.email.endsWith("@smartagesolutions.com") && (
                                <>
                                  <DropdownMenuItem onClick={() => { setUserToPromote(user); setIsPromoteOpen(true); }}>
                                    <Shield className="h-4 w-4 mr-2 text-orange-500" />
                                    Promote to Backoffice
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Tenant User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {!isUsersLoading && filteredUsers.length > 0 && <p className="text-right text-xs text-muted-foreground">Showing {filteredUsers.length} total users</p>}
          </div>
        )}

        {/* ─── TAB: BACKOFFICE STAFF ─── */}
        {activeTab === "staff" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff members..."
                  className="pl-9"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-orange-500/20 rounded-xl bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-500/5 hover:bg-orange-500/5">
                    <TableHead className="text-orange-900/60 dark:text-orange-300/60">Staff Member</TableHead>
                    <TableHead className="text-orange-900/60 dark:text-orange-300/60">Access Level</TableHead>
                    <TableHead className="text-orange-900/60 dark:text-orange-300/60">Status</TableHead>
                    <TableHead className="text-orange-900/60 dark:text-orange-300/60">Joined</TableHead>
                    <TableHead className="text-right w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isStaffLoading ? (
                    <TableRow><TableCell colSpan={5} className="py-8"><div className="h-6 w-full rounded bg-muted animate-pulse" /></TableCell></TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No backoffice staff found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((member) => (
                      <TableRow key={member.id} className="hover:bg-orange-500/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={member.name} colorClass="bg-gradient-to-br from-orange-400 to-rose-400" />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-sm">{member.name}</span>
                              <span className="text-xs text-muted-foreground">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            Super Admin
                          </span>
                        </TableCell>
                        <TableCell>
                           {member.is_active ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                              <XCircle className="h-4 w-4" /> Suspended
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleStaff(member.id)}
                                className={member.is_active ? "text-rose-600" : "text-emerald-600"}
                              >
                                {member.is_active ? "Suspend Access" : "Reactivate Access"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteStaff(member.id)} className="text-rose-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ─── MODALS ─── */}
        
        {/* Create Tenant User Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) setNewUser({ clientId: "", name: "", email: "", password: "", role: "member" }); setIsCreateOpen(open); }}>
          <DialogContent className="max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>Create Tenant User</DialogTitle>
              <DialogDescription>Create a normal user inside a specific client workspace.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Client Workspace *</Label>
                <Select value={newUser.clientId} onValueChange={(val) => setNewUser({ ...newUser, clientId: val })} required>
                  <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input required placeholder="John Doe" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })} required>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input required type="email" placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input required type="password" placeholder="••••••••" minLength={8} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>Create User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Backoffice Staff Dialog */}
        <Dialog open={isCreateStaffOpen} onOpenChange={(open) => { if (!open) setNewStaff({ name: "", email: "", password: "" }); setIsCreateStaffOpen(open); }}>
          <DialogContent className="max-w-md bg-card border-orange-500/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <ShieldAlert className="h-5 w-5" /> Add Backoffice Staff
              </DialogTitle>
              <DialogDescription>
                Create a Super Admin who has full access to impersonate any client and manage the platform. 
                <br/><br/>
                <strong className="text-foreground">Email must end with @smartagesolutions.com.</strong>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Staff Name *</Label>
                <Input required placeholder="Jane Smith" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Staff Email *</Label>
                <Input required type="email" placeholder="jane@smartagesolutions.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Initial Password *</Label>
                <Input required type="password" placeholder="••••••••" minLength={8} value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateStaffOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="bg-orange-600 hover:bg-orange-700 text-white">
                  Add Staff Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Promote User Dialog */}
        <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
          <DialogContent className="max-w-md bg-card border-orange-500/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <Shield className="h-5 w-5" /> Promote to Backoffice
              </DialogTitle>
              <DialogDescription>
                You are about to give <strong>{userToPromote?.name}</strong> full Super Admin access to the platform.
                Because this is a completely separate identity, you need to set their initial backoffice password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePromoteUser} className="space-y-4 mt-2">
               <div className="space-y-2">
                <Label>Email</Label>
                <Input disabled value={userToPromote?.email || ""} className="bg-muted text-muted-foreground border-none" />
              </div>
              <div className="space-y-2">
                <Label>New Backoffice Password *</Label>
                <Input
                  required
                  type="password"
                  placeholder="Set an initial password"
                  minLength={8}
                  value={promotePassword}
                  onChange={(e) => setPromotePassword(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPromoteOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="bg-orange-600 hover:bg-orange-700 text-white">
                  Confirm Promotion
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


      </div>
    </DashboardLayout>
  );
}
