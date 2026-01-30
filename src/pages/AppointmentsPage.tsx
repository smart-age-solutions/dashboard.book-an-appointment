import { useState } from "react";
import { format } from "date-fns";
import { Search, Filter, MoreHorizontal, Eye, Edit2, Trash2, X, User, Mail, Clock, Calendar, Phone, FileText, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useStores } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { useEffect } from "react";
import { parseLocalDate } from "@/lib/date";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Appointment {
  id: string;
  client: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  phone_area_code: string;
  country_of_residence: string;
  preferred_communication: string;
  accepted_terms: boolean;
  consent_communication: boolean;
  service: string;
  date: Date;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  duration: string;
  notes: string;
  storeId: string;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AppointmentsPage() {
  const { stores } = useStores();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Appointment & { first_name: string; last_name: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 50;

  const fetchAppointments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        per_page: perPage
      };
      if (statusFilter !== "all") params.status = statusFilter;
      
      const data = await api.get("/appointments", params);
      
      // Transform backend format to frontend format
      const transformed: Appointment[] = data.appointments.map((apt: any) => ({
        id: apt.id,
        first_name: apt.first_name,
        last_name: apt.last_name || "",
        client: `${apt.first_name} ${apt.last_name || ""}`.trim(),
        email: apt.email,
        phone: apt.phone || "",
        title: apt.title || "",
        phone_area_code: apt.phone_area_code || "",
        country_of_residence: apt.country_of_residence || "",
        preferred_communication: apt.preferred_communication || "email",
        accepted_terms: apt.accepted_terms || false,
        consent_communication: apt.consent_communication || false,
        service: apt.purpose || "General",
        date: parseLocalDate(apt.date),
        time: apt.time, // HH:MM format from backend
        status: apt.status,
        duration: "1 hour", // Backend doesn't store duration yet
        notes: apt.notes || "",
        storeId: apt.store_id || "",
      }));
      
      setAppointments(transformed);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalItems(data.pagination?.total_items || 0);
      setCurrentPage(data.pagination?.page || 1);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1);
  }, [statusFilter]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = apt.client.toLowerCase().includes(search.toLowerCase()) ||
      apt.email.toLowerCase().includes(search.toLowerCase()) ||
      apt.service.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setEditFormData({
      client: apt.client,
      first_name: apt.first_name,
      last_name: apt.last_name,
      email: apt.email,
      phone: apt.phone,
      title: apt.title,
      phone_area_code: apt.phone_area_code,
      country_of_residence: apt.country_of_residence,
      preferred_communication: apt.preferred_communication,
      accepted_terms: apt.accepted_terms,
      consent_communication: apt.consent_communication,
      service: apt.service,
      date: apt.date,
      time: apt.time,
      duration: apt.duration,
      status: apt.status,
      notes: apt.notes,
      storeId: apt.storeId,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;

    try {
      const payload: any = {};
      if (editFormData.first_name) payload.first_name = editFormData.first_name;
      if (editFormData.last_name !== undefined) payload.last_name = editFormData.last_name;
      if (editFormData.email) payload.email = editFormData.email;
      if (editFormData.phone) payload.phone = editFormData.phone;
      if (editFormData.service) payload.purpose = editFormData.service;
      if (editFormData.status) payload.status = editFormData.status;
      if (editFormData.notes !== undefined) payload.notes = editFormData.notes;
      if (editFormData.storeId) payload.store_id = editFormData.storeId;
      if (editFormData.title) payload.title = editFormData.title;
      if (editFormData.phone_area_code) payload.phone_area_code = editFormData.phone_area_code;
      if (editFormData.country_of_residence) payload.country_of_residence = editFormData.country_of_residence;
      if (editFormData.preferred_communication) payload.preferred_communication = editFormData.preferred_communication;
      payload.accepted_terms = editFormData.accepted_terms;
      payload.consent_communication = editFormData.consent_communication;
      if (editFormData.date) payload.date = format(editFormData.date, "yyyy-MM-dd");
      if (editFormData.time) payload.time = editFormData.time;

      await api.put(`/appointments/${selectedAppointment.id}`, payload);
      
      toast({ title: "Updated", description: "Appointment updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = async (apt: Appointment) => {
    try {
      await api.delete(`/appointments/${apt.id}`);
      toast({ title: "Cancelled", description: "Appointment has been cancelled" });
      fetchAppointments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || "Unknown Store";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all your appointments
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-card card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => (
                  <TableRow key={apt.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{apt.client}</p>
                        <p className="text-sm text-muted-foreground">{apt.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-card-foreground">{apt.service}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-card-foreground">{format(apt.date, "MMM d, yyyy")}</p>
                        <p className="text-sm text-muted-foreground">{apt.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{apt.duration}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", statusStyles[apt.status])}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(apt)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(apt)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {apt.status !== "cancelled" && apt.status !== "completed" && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleCancel(apt)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Showing {filteredAppointments.length} of {totalItems} appointments</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAppointments(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAppointments(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{selectedAppointment.client}</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.service}</p>
                  </div>
                  <Badge variant="outline" className={cn("ml-auto capitalize", statusStyles[selectedAppointment.status])}>
                    {selectedAppointment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Date</p>
                    </div>
                    <p className="font-medium text-card-foreground">{format(selectedAppointment.date, "MMM d, yyyy")}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                    <p className="font-medium text-card-foreground">{selectedAppointment.time}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                  <p className="font-medium text-card-foreground">{selectedAppointment.duration}</p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedAppointment.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-card-foreground">{selectedAppointment.phone}</p>
                  </div>
                </div>

                {stores.length > 1 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Store</p>
                      <p className="text-sm font-medium text-card-foreground">{getStoreName(selectedAppointment.storeId)}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Notes</p>
                    </div>
                    <p className="text-sm text-card-foreground">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button className="flex-1" onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(selectedAppointment);
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Title</Label>
                  <Select
                    value={editFormData.title || ""}
                    onValueChange={(v) => setEditFormData({ ...editFormData, title: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr.</SelectItem>
                      <SelectItem value="Mrs">Mrs.</SelectItem>
                      <SelectItem value="Ms">Ms.</SelectItem>
                      <SelectItem value="Dr">Dr.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={editFormData.first_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={editFormData.last_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Input
                    value={editFormData.service || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, service: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(v) => setEditFormData({ ...editFormData, status: v as Appointment["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                  <Input
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Phone Area Code</Label>
                  <Input
                    value={editFormData.phone_area_code || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone_area_code: e.target.value })}
                    placeholder="+1"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editFormData.phone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country of Residence</Label>
                  <Input
                    value={editFormData.country_of_residence || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, country_of_residence: e.target.value })}
                    placeholder="USA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Communication</Label>
                  <Select
                    value={editFormData.preferred_communication || "email"}
                    onValueChange={(v) => setEditFormData({ ...editFormData, preferred_communication: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editFormData.date ? format(editFormData.date, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const newDate = e.target.value ? parseLocalDate(e.target.value) : undefined;
                      setEditFormData({ ...editFormData, date: newDate });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    value={editFormData.time || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={editFormData.duration || "60"}
                    onValueChange={(v) => setEditFormData({ ...editFormData, duration: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {stores.length > 1 && (
                  <div className="space-y-2">
                    <Label>Store</Label>
                    <Select
                      value={editFormData.storeId}
                      onValueChange={(v) => setEditFormData({ ...editFormData, storeId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-terms"
                  checked={editFormData.accepted_terms || false}
                  onChange={(e) => setEditFormData({ ...editFormData, accepted_terms: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-terms" className="text-sm font-normal">Accepted Terms</Label>
              </div>

              <div className="flex items-center space-x-2 pb-2">
                 <input
                  type="checkbox"
                  id="edit-consent"
                  checked={editFormData.consent_communication || false}
                  onChange={(e) => setEditFormData({ ...editFormData, consent_communication: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-consent" className="text-sm font-normal">Consent to Communication</Label>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={editFormData.notes || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
