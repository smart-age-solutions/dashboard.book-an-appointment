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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth, BackofficeUser as AuthBackofficeUser } from "@/contexts/AuthContext";

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
  role: "super_admin" | "limited";
  created_at: string;
  has_tenant_account: boolean;
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
  const { user } = useAuth();
  const currentStaff = user as AuthBackofficeUser | null;
  // Limited backoffice admins are read-only here: no staff management, no
  // creating/deleting tenant users or promoting one to backoffice staff.
  const isLimited = currentStaff?.role === "limited";

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = isLimited ? "tenants" : (searchParams.get("tab") === "staff" ? "staff" : "tenants");

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
  const [promoteRole, setPromoteRole] = useState("super_admin");
  const [promoteSendInvite, setPromoteSendInvite] = useState(true);

  // Staff State
  const [staff, setStaff] = useState<BackofficeStaff[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(true);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "super_admin" });

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
      const res = await api.delete(`/backoffice/users/${userId}`);
      toast({ title: "Deleted", description: res.message ?? "User deleted successfully." });
      setUsers(users.filter(u => u.id !== userId));
    } catch (error: any) {
      const conflicts = error.data?.conflicting_appointments as { date: string; time: string }[] | undefined;
      const description = conflicts?.length
        ? `${error.message} Conflicting slot(s): ${conflicts.map(c => `${c.date} ${c.time}`).join(", ")}.`
        : error.message;
      toast({ title: "Error", description, variant: "destructive" });
    }
  };

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToPromote) return;
    if (!promoteSendInvite && !promotePassword) return;
    setIsCreating(true);
    try {
      await api.post("/backoffice/staff/promote", {
        email: userToPromote.email,
        name: userToPromote.name,
        role: promoteRole,
        ...(promoteSendInvite ? {} : { password: promotePassword }),
      });
      toast({
        title: "Successfully Promoted",
        description: promoteSendInvite
          ? `${userToPromote.name} has been emailed an invite to set their backoffice password.`
          : `${userToPromote.name} can now log in as backoffice staff.`,
      });
      setIsPromoteOpen(false);
      setPromotePassword("");
      setPromoteRole("super_admin");
      setPromoteSendInvite(true);
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
      const res = await api.post("/backoffice/staff/create", newStaff);
      toast({ title: "Invite Sent", description: res.message ?? "Backoffice user created and invited." });
      setIsCreateStaffOpen(false);
      setNewStaff({ name: "", email: "", role: "super_admin" });
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

  const handleDemoteStaff = async (member: BackofficeStaff) => {
    if (!confirm(`Remove ${member.name}'s backoffice access and send them back to their tenant account?`)) return;
    try {
      const res = await api.post(`/backoffice/staff/${member.id}/demote`);
      toast({ title: "Demoted", description: res.message ?? `${member.name} no longer has backoffice access.` });
      setStaff(staff.filter(s => s.id !== member.id));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleChangeStaffRole = async (staffId: string, role: "super_admin" | "limited") => {
    try {
      await api.put(`/backoffice/staff/${staffId}/role`, { role });
      toast({ title: "Role Updated", description: "Staff access level updated." });
      setStaff(staff.map(s => s.id === staffId ? { ...s, role } : s));
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
              !isLimited && (
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tenant User
                </Button>
              )
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
          {!isLimited && (
            <button
              onClick={() => setSearchParams({ tab: "staff" })}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "staff" ? "border-orange-500 text-orange-500" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Backoffice Staff
            </button>
          )}
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
                          {!isLimited && (
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
                          )}
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
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider border ${
                            member.role === "limited"
                              ? "bg-slate-500/10 text-slate-600 border-slate-500/20"
                              : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                          }`}>
                            {member.role === "limited" ? "Limited" : "Super Admin"}
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
                              {member.id !== currentStaff?.id && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleChangeStaffRole(member.id, member.role === "limited" ? "super_admin" : "limited")}
                                  >
                                    <Shield className="h-4 w-4 mr-2 text-orange-500" />
                                    {member.role === "limited" ? "Make Super Admin" : "Make Limited"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleToggleStaff(member.id)}
                                className={member.is_active ? "text-rose-600" : "text-emerald-600"}
                              >
                                {member.is_active ? "Suspend Access" : "Reactivate Access"}
                              </DropdownMenuItem>
                              {member.id !== currentStaff?.id && member.has_tenant_account && (
                                <DropdownMenuItem onClick={() => handleDemoteStaff(member)}>
                                  <ArrowRightCircle className="h-4 w-4 mr-2 text-orange-500" />
                                  Demote to Tenant User
                                </DropdownMenuItem>
                              )}
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
        <Dialog open={isCreateStaffOpen} onOpenChange={(open) => { if (!open) setNewStaff({ name: "", email: "", role: "super_admin" }); setIsCreateStaffOpen(open); }}>
          <DialogContent className="max-w-md bg-card border-orange-500/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <ShieldAlert className="h-5 w-5" /> Add Backoffice Staff
              </DialogTitle>
              <DialogDescription>
                Invite a backoffice staff account that can enter Admin Mode to manage client data.
                They'll get an email to set their own password on first login.
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
                <Label>Access Level *</Label>
                <Select value={newStaff.role} onValueChange={(val) => setNewStaff({ ...newStaff, role: val })} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin — full access</SelectItem>
                    <SelectItem value="limited">Limited — view only + Admin Mode</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {newStaff.role === "limited"
                    ? "Can view clients and users and enter Admin Mode, but cannot create/delete clients, manage tenant users, or manage other backoffice staff."
                    : "Full access to manage clients, tenant users, and other backoffice staff."}
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateStaffOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="bg-orange-600 hover:bg-orange-700 text-white">
                  Send Invite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Promote User Dialog */}
        <Dialog open={isPromoteOpen} onOpenChange={(open) => { if (!open) { setPromotePassword(""); setPromoteRole("super_admin"); setPromoteSendInvite(true); } setIsPromoteOpen(open); }}>
          <DialogContent className="max-w-md bg-card border-orange-500/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <Shield className="h-5 w-5" /> Promote to Backoffice
              </DialogTitle>
              <DialogDescription>
                You are about to give <strong>{userToPromote?.name}</strong> backoffice access to the platform.
                Because this is a completely separate identity, they need a backoffice password — either set one now, or send them an email to set their own.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePromoteUser} className="space-y-4 mt-2">
               <div className="space-y-2">
                <Label>Email</Label>
                <Input disabled value={userToPromote?.email || ""} className="bg-muted text-muted-foreground border-none" />
              </div>
              <div className="space-y-2">
                <Label>Access Level *</Label>
                <Select value={promoteRole} onValueChange={setPromoteRole} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin — full access</SelectItem>
                    <SelectItem value="limited">Limited — view only + Admin Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-sm">Send invite email instead</Label>
                  <p className="text-[11px] text-muted-foreground">
                    They'll set their own password the next time they try to access the dashboard.
                  </p>
                </div>
                <Switch checked={promoteSendInvite} onCheckedChange={setPromoteSendInvite} />
              </div>
              {!promoteSendInvite && (
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
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPromoteOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {promoteSendInvite ? "Send Invite & Promote" : "Confirm Promotion"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


      </div>
    </DashboardLayout>
  );
}
