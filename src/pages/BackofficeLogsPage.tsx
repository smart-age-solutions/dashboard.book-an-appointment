import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Search, Filter, User, Building2, Clock, Activity, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  actor: {
    name: string;
    type: "backoffice" | "client" | "system";
  };
  client?: {
    id: string;
    name: string;
  };
  metadata?: Record<string, string>;
}

const mockLogs: ActivityLog[] = [];

const typeStyles: Record<string, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-blue-500 bg-blue-500/10" },
  success: { icon: CheckCircle2, className: "text-green-500 bg-green-500/10" },
  warning: { icon: AlertCircle, className: "text-amber-500 bg-amber-500/10" },
  error: { icon: AlertCircle, className: "text-destructive bg-destructive/10" },
};

const actorStyles: Record<string, string> = {
  backoffice: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  client: "bg-primary/10 text-primary border-primary/20",
  system: "bg-muted text-muted-foreground border-border",
};

export default function BackofficeLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>(mockLogs);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  const formatDescription = (action: string, details: any) => {
    if (!details) return action.replace(/_/g, " ");
    if (typeof details === "string") return details;

    switch (action) {
      case "update_settings":
        return `Updated settings: ${details.updated_fields?.join(", ") || "various fields"}`;
      case "create_appointment":
        return `New appointment for ${details.client_name || "a client"}`;
      case "cancel_appointment":
        return `Cancelled appointment ${details.appointment_id || ""}`;
      case "login":
        return "Member logged in";
      case "invite_user":
        return `Invited user ${details.email || ""}`;
      case "update_branding":
        return "Updated company branding";
      case "update_store":
        return `Updated store: ${details.store_name || details.store_id || ""}`;
      default:
        // Fallback for any other object details
        return JSON.stringify(details).slice(0, 100);
    }
  };

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get("/auth/activity-logs/global");
      setLogs(data.logs.map((l: any) => ({
        id: l.id,
        timestamp: new Date(l.created_at),
        action: l.action,
        description: formatDescription(l.action, l.details),
        type: l.action.includes("failed") || l.action.includes("error") ? "error" : "info",
        actor: { 
          name: l.actor_id === "system" ? "System" : (l.details?.actor_name || "Admin"), 
          type: l.actor_type === "backoffice" ? "backoffice" : l.actor_type === "client" ? "client" : "system" 
        },
        client: l.client_id ? { 
          id: l.client_id, 
          name: l.client_name || l.details?.company_name || `Client #${l.client_id.slice(0,8)}` 
        } : undefined
      })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.name.toLowerCase().includes(search.toLowerCase()) ||
      log.client?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    const matchesActor = actorFilter === "all" || log.actor.type === actorFilter;
    return matchesSearch && matchesType && matchesActor;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/10">
            <Activity className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Global Activity Logs</h1>
            <p className="text-muted-foreground">
              View all system activity across clients
            </p>
          </div>
          <Badge variant="outline" className="ml-auto bg-blue-600/10 text-blue-500 border-blue-600/20">
            Smart Age Solutions
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actors</SelectItem>
              <SelectItem value="backoffice">Backoffice</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-card card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const TypeIcon = typeStyles[log.type].icon;
                return (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className={cn("p-2 rounded-lg w-fit", typeStyles[log.type].className)}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-card-foreground text-sm">{format(log.timestamp, "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(log.timestamp, "HH:mm:ss")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.action}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.actor.type === "backoffice" && <User className="h-4 w-4 text-blue-500" />}
                        {log.actor.type === "client" && <Building2 className="h-4 w-4 text-primary" />}
                        {log.actor.type === "system" && <Activity className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{log.actor.name}</p>
                          <Badge variant="outline" className={cn("text-xs", actorStyles[log.actor.type])}>
                            {log.actor.type}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.client ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-card-foreground">{log.client.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination hint */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Showing {filteredLogs.length} of {logs.length} logs</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
