import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Download, Mail, Users, CheckCircle, XCircle, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Customer {
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  phone: string;
  phone_area_code: string | null;
  phone_number: string | null;
  country_of_residence: string | null;
  preferred_communication: string | null;
  accepted_terms: boolean;
  consent_communication: boolean;
  custom_data: Record<string, unknown>;
  last_appointment_date: string | null;
  appointment_count: number;
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [consentOnly, setConsentOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"full" | "marketing" | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const PER_PAGE = 50;

  const fetchCustomers = useCallback(async (p: number, q: string, co: boolean) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: PER_PAGE };
      if (q) params.search = q;
      if (co) params.consent_only = 1;
      const res = await api.get("/customers", params);
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers(page, search, consentOnly);
  }, [page, search, consentOnly, fetchCustomers]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 350);
  };

  const handleConsentToggle = () => {
    setPage(1);
    setConsentOnly(v => !v);
  };

  const downloadCsv = async (mode: "full" | "marketing") => {
    setIsExporting(mode);
    try {
      const token = localStorage.getItem("access_token");
      const impersonated = localStorage.getItem("impersonate_client");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (impersonated) headers["X-Impersonate-Client-ID"] = JSON.parse(impersonated).id;

      const params = new URLSearchParams({ mode });
      if (search) params.set("search", search);
      if (consentOnly || mode === "marketing") params.set("consent_only", "true");

      const res = await fetch(`${API_URL}/customers/export?${params}`, { headers });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mode === "marketing" ? "email_marketing.csv" : "customers.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const BoolBadge = ({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) => (
    value
      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle className="h-3 w-3" />{trueLabel}</span>
      : <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><XCircle className="h-3 w-3" />{falseLabel}</span>
  );

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          All unique customers who have booked an appointment.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, phone…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        <button
          onClick={handleConsentToggle}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            consentOnly
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          <Filter className="h-4 w-4" />
          Consent to Comms only
        </button>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv("marketing")}
            disabled={isExporting !== null}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isExporting === "marketing" ? "Exporting…" : "Export for Email Marketing"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv("full")}
            disabled={isExporting !== null}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting === "full" ? "Exporting…" : "Export All Data"}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <strong className="text-foreground">{total.toLocaleString()}</strong> customer{total !== 1 ? "s" : ""}
          {consentOnly && " with consent"}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Country</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pref. Channel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Terms</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Consent</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Appts</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Appt</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    Loading customers…
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map(c => {
                  const isExpanded = expandedRow === c.email;
                  const hasExtra = (c.title || c.preferred_communication || Object.keys(c.custom_data).length > 0);
                  return (
                    <>
                      <tr
                        key={c.email}
                        className={`border-b last:border-0 transition-colors ${hasExtra ? "cursor-pointer hover:bg-muted/30" : ""} ${isExpanded ? "bg-muted/20" : ""}`}
                        onClick={() => hasExtra && setExpandedRow(isExpanded ? null : c.email)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{c.name || <span className="text-muted-foreground italic">—</span>}</div>
                          {c.title && <div className="text-xs text-muted-foreground">{c.title}</div>}
                        </td>
                        <td className="px-4 py-3 text-foreground">{c.email}</td>
                        <td className="px-4 py-3 text-foreground">{c.phone || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-foreground">{c.country_of_residence || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3">
                          {c.preferred_communication
                            ? <Badge variant="secondary" className="capitalize">{c.preferred_communication}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <BoolBadge value={c.accepted_terms} trueLabel="Accepted" falseLabel="No" />
                        </td>
                        <td className="px-4 py-3">
                          <BoolBadge value={c.consent_communication} trueLabel="Yes" falseLabel="No" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold w-7 h-7">
                            {c.appointment_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {c.last_appointment_date ?? "—"}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${c.email}-expanded`} className="bg-muted/10 border-b">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="flex flex-wrap gap-8 text-sm">
                              {c.first_name && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">First Name</p>
                                  <p className="font-medium">{c.first_name}</p>
                                </div>
                              )}
                              {c.last_name && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Last Name</p>
                                  <p className="font-medium">{c.last_name}</p>
                                </div>
                              )}
                              {c.title && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Title</p>
                                  <p className="font-medium">{c.title}</p>
                                </div>
                              )}
                              {c.phone_area_code && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Area Code</p>
                                  <p className="font-medium">+{c.phone_area_code}</p>
                                </div>
                              )}
                              {c.preferred_communication && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Preferred Channel</p>
                                  <p className="font-medium capitalize">{c.preferred_communication}</p>
                                </div>
                              )}
                              {Object.keys(c.custom_data).length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Custom Data</p>
                                  <div className="space-y-0.5">
                                    {Object.entries(c.custom_data).map(([k, v]) => (
                                      <p key={k} className="font-medium">
                                        <span className="capitalize">{k.replace(/_/g, " ")}</span>
                                        {": "}
                                        {String(v)}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
