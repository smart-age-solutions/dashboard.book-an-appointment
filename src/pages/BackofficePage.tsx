import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, UserCog, ToggleLeft, ToggleRight, Building2, UserPlus } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface Client {
  id: string;
  companyName: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
  branding?: {
    primaryColor: string;
    logo: string;
  };
  settings?: {
    timezone: string;
    language: string;
    bookingWindowDays: number;
  };
}

// Mock data
const mockClients: Client[] = [];

export default function BackofficePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { toast } = useToast();
  const { startImpersonation } = useImpersonation();
  const { user, isBackofficeUser } = useAuth();

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get("/backoffice/clients");
      setClients(data.clients.map((c: any) => ({
        id: c.id,
        companyName: c.company_name,
        email: c.email || "N/A",
        status: c.is_active ? "active" : "inactive",
        createdAt: c.created_at,
        branding: { primaryColor: c.brand_color, logo: c.logo_url },
        settings: { timezone: c.timezone, language: c.language, bookingWindowDays: c.booking_window_days },
      })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleToggleStatus = async (clientId: string) => {
    try {
      await api.post(`/backoffice/clients/${clientId}/toggle-status`);
      toast({
        title: "Status Updated",
        description: "Client status has been toggled successfully.",
      });
      fetchClients();
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

  const handleImpersonate = (client: Client) => {
    startImpersonation({ id: client.id, companyName: client.companyName });
    toast({
      title: "Impersonation Started",
      description: `You are now acting as ${client.companyName}.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backoffice</h1>
            <p className="mt-1 text-muted-foreground">
              Manage all tenants and clients in the system.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/backoffice/invite")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
            {/* Employee Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="text-sm">
                <span className="text-blue-700 dark:text-blue-300 font-medium">Smart Age Solutions</span>
                {user && (
                  <span className="text-blue-600 dark:text-blue-400 ml-2">• {user.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clients Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.companyName}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={client.status === "active" ? "default" : "secondary"}
                      className={
                        client.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {client.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(client)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(client.id)}
                        title={client.status === "active" ? "Deactivate" : "Activate"}
                      >
                        {client.status === "active" ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleImpersonate(client)}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Impersonate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No clients found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Client Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedClient?.companyName}</DialogTitle>
              <DialogDescription>{selectedClient?.email}</DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">General Info</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={selectedClient.status === "active" ? "default" : "secondary"}
                      className={
                        selectedClient.status === "active"
                          ? "bg-green-100 text-green-800 w-fit"
                          : "bg-gray-100 text-gray-800 w-fit"
                      }
                    >
                      {selectedClient.status}
                    </Badge>
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedClient.branding && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Branding</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Primary Color:</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: selectedClient.branding.primaryColor }}
                        />
                        <span>{selectedClient.branding.primaryColor}</span>
                      </div>
                      <span className="text-muted-foreground">Logo:</span>
                      <span>{selectedClient.branding.logo}</span>
                    </div>
                  </div>
                )}

                {selectedClient.settings && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Settings</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Timezone:</span>
                      <span>{selectedClient.settings.timezone}</span>
                      <span className="text-muted-foreground">Language:</span>
                      <span>{selectedClient.settings.language}</span>
                      <span className="text-muted-foreground">Booking Window:</span>
                      <span>{selectedClient.settings.bookingWindowDays} days</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
