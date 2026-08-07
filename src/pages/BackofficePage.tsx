import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  UserCog,
  ToggleRight,
  ToggleLeft,
  Building2,
  UserPlus,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  LogOut,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface Client {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
  branding?: { primaryColor: string; logo: string };
  settings?: { timezone: string; language: string; bookingWindowDays: number };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-card border border-border p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ClientAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-white text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function BackofficePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const { toast } = useToast();
  const { startAdminMode } = useAdminMode();
  const { user, logout } = useAuth();

  const fetchClients = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await api.get("/backoffice/clients");
      setClients(
        data.clients.map((c: any) => ({
          id: c.id,
          companyName: c.company_name,
          email: c.email || "N/A",
          phone: c.phone,
          status: c.is_active ? "active" : "inactive",
          createdAt: c.created_at,
          branding: { primaryColor: c.brand_color, logo: c.logo_url },
          settings: {
            timezone: c.timezone,
            language: c.language,
            bookingWindowDays: c.booking_window_days,
          },
        }))
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const activeCount  = clients.filter((c) => c.status === "active").length;
  const inactiveCount = clients.filter((c) => c.status === "inactive").length;

  const handleToggleStatus = async (client: Client) => {
    try {
      await api.post(`/backoffice/clients/${client.id}/toggle-status`);
      toast({
        title: client.status === "active" ? "Client Deactivated" : "Client Activated",
        description: `${client.companyName} has been ${client.status === "active" ? "deactivated" : "activated"}.`,
      });
      fetchClients(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleViewDetails = async (client: Client) => {
    try {
      const data = await api.get(`/backoffice/clients/${client.id}`);
      setSelectedClient({
        id: data.id,
        companyName: data.company_name,
        email: data.email || "N/A",
        phone: data.phone,
        status: data.is_active ? "active" : "inactive",
        createdAt: data.created_at,
        branding: { primaryColor: data.brand_color, logo: data.logo_url },
        settings: { timezone: data.timezone, language: data.language, bookingWindowDays: data.booking_window_days },
      });
      setIsDetailsOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await api.post("/backoffice/logout-all");
      toast({
        title: "All users logged out",
        description: "Every active session, including yours, has been invalidated.",
      });
      logout();
      navigate("/login");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoggingOutAll(false);
      setIsLogoutAllOpen(false);
    }
  };

  const handleManageClient = (client: Client) => {
    startAdminMode({ id: client.id, companyName: client.companyName });
    toast({ title: "Admin Mode", description: `Now managing ${client.companyName}.` });
    navigate("/");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-blue-600/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-[52px]">
              Manage all tenant workspaces · Logged in as{" "}
              <span className="font-medium text-blue-400">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchClients(true)}
              disabled={isRefreshing}
              className="text-muted-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/backoffice/clients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Register Client
            </Button>
            <Button size="sm" onClick={() => navigate("/backoffice/users?tab=staff")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Staff
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              onClick={() => setIsLogoutAllOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout All Users
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={clients.length} icon={Building2} color="bg-blue-500/10 text-blue-500" />
          <StatCard label="Active" value={activeCount} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-500" />
          <StatCard label="Inactive" value={inactiveCount} icon={XCircle} color="bg-rose-500/10 text-rose-500" />
          <StatCard label="Showing" value={filteredClients.length} icon={Users} color="bg-purple-500/10 text-purple-500" />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name or email…"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[280px]">Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="h-12 w-12 opacity-20" />
                      <p className="font-medium">No clients found</p>
                      <p className="text-sm">Try adjusting your search or filter.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ClientAvatar name={client.companyName} />
                        <div>
                          <p className="font-semibold text-foreground text-sm">{client.companyName}</p>
                          {client.phone && (
                            <p className="text-xs text-muted-foreground">{client.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          client.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20 border"
                        }
                      >
                        {client.status === "active" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {client.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.settings?.timezone ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {client.settings.timezone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(client.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageClient(client)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Manage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(client)}
                            className={client.status === "active" ? "text-rose-600 focus:text-rose-600" : "text-emerald-600 focus:text-emerald-600"}
                          >
                            {client.status === "active" ? (
                              <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                            ) : (
                              <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                            )}
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

        {!isLoading && filteredClients.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {filteredClients.length} of {clients.length} clients
          </p>
        )}
      </div>

      {/* ── Client Details Dialog ── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedClient && <ClientAvatar name={selectedClient.companyName} />}
              <div>
                <DialogTitle className="text-lg">{selectedClient?.companyName}</DialogTitle>
                <DialogDescription>{selectedClient?.email}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4 mt-2">
              {/* Status banner */}
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                selectedClient.status === "active"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
              }`}>
                {selectedClient.status === "active"
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <XCircle className="h-4 w-4" />}
                {selectedClient.status === "active" ? "Account is Active" : "Account is Inactive"}
              </div>

              {/* General Info */}
              <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                {[
                  { label: "Created", value: new Date(selectedClient.createdAt).toLocaleDateString("en-US", { dateStyle: "long" }) },
                  { label: "Phone", value: selectedClient.phone || "—" },
                  { label: "Timezone", value: selectedClient.settings?.timezone || "—" },
                  { label: "Booking Window", value: selectedClient.settings?.bookingWindowDays ? `${selectedClient.settings.bookingWindowDays} days` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
                {selectedClient.branding?.primaryColor && (
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Brand Color</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded border border-border"
                        style={{ backgroundColor: selectedClient.branding.primaryColor }}
                      />
                      <span className="font-mono text-xs">{selectedClient.branding.primaryColor}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsDetailsOpen(false); handleManageClient(selectedClient); }}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 ${selectedClient.status === "active" ? "text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20" : "text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}`}
                  onClick={() => { handleToggleStatus(selectedClient); setIsDetailsOpen(false); }}
                >
                  {selectedClient.status === "active"
                    ? <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                    : <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Logout All Users Confirmation ── */}
      <AlertDialog open={isLogoutAllOpen} onOpenChange={setIsLogoutAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout all users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end every active session across all clients, staff and
              backoffice accounts — including your own. Everyone will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOutAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
              disabled={isLoggingOutAll}
              onClick={handleLogoutAll}
            >
              {isLoggingOutAll ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Logging out…</>
              ) : (
                "Logout everyone"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
