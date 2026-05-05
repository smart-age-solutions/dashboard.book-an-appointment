import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, MoreHorizontal, Edit2, Trash2, LayoutTemplate, Link as LinkIcon, Users, Settings, MapPin, Mail, Clock, Calendar, Globe, Eye, Copy, Upload, Image } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";


interface UserData {
  id: string;
  name: string;
  email: string;
}

interface StoreData {
  id: string;
  name: string;
}

interface EmailTemplateData {
  id: string;
  name: string;
  type: string;
}

interface BookingPageDayHours {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BookingPageData {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  timezone: string;
  buffer_time_minutes: number;
  description: string;
  slot_duration_minutes: number;
  booking_window_days: number;
  hours?: BookingPageDayHours[];
  users?: any[];
  stores?: any[];
  email_templates?: any[];
  show_map_in_email?: boolean;
  map_url?: string;
  map_image_url?: string;
  lat?: string;
  lng?: string;
  edit_appointment_url?: string;
  cancel_appointment_url?: string;
  widget_enabled?: boolean;
  allowed_domains?: string;
  extra_cc_emails?: string;
  service_name?: string;
}

export default function BookingPagesPage() {
  const { client } = useAuth();
  const [pages, setPages] = useState<BookingPageData[]>([]);

  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [allStores, setAllStores] = useState<StoreData[]>([]);
  const [allTemplates, setAllTemplates] = useState<EmailTemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<BookingPageData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    timezone: "UTC",
    buffer_time_minutes: 0,
    description: "",
    is_active: true,
    slot_duration_minutes: 60,
    booking_window_days: 30,
    show_map_in_email: true,
    map_url: "",
    map_image_url: "",
    lat: "",
    lng: "",
    edit_appointment_url: "",
    cancel_appointment_url: "",
    hours: Array.from({length: 7}, (_, i) => ({
        day_of_week: i,
        start_time: "09:00",
        end_time: "18:00",
        is_active: i < 5
    })),
    widget_enabled: false,
    allowed_domains: "",
    extra_cc_emails: "",
    service_name: "",
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [ccUserIds, setCcUserIds] = useState<string[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [emailTriggers, setEmailTriggers] = useState({
    confirmation: "none",
    update: "none",
    cancellation: "none",
    reminder: "none"
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pagesRes, storesRes, usersRes, templatesRes] = await Promise.all([
        api.get("/booking-pages", { include_inactive: "true" }),
        api.get("/auth/stores"),
        api.get("/teams/all-members"),
        api.get("/email-templates")
      ]);

      // Pages come with limited data in list, we usually need details for some parts but list is fine for overview
      const fullPages: any[] = await Promise.all(pagesRes.booking_pages.map((p: any) => 
        api.get(`/booking-pages/${p.id}`)
      ));
      
      setPages(fullPages.map(r => r.booking_page));
      setAllStores(storesRes.stores || []);

      setAllUsers(usersRes.users || []);
      setAllTemplates(templatesRes.templates || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Missing fields", description: "Name and Slug are required", variant: "destructive" });
      return;
    }

    if (!selectedUserId) {
      toast({ title: "Validation Error", description: "A Bookable Staff member must be assigned.", variant: "destructive" });
      return;
    }

    try {
      let pageId = editingPage?.id;
      
      if (editingPage) {
        await api.put(`/booking-pages/${editingPage.id}`, formData);
        toast({ title: "Updated", description: "Booking page settings updated." });
      } else {
        const createRes = await api.post("/booking-pages", formData);
        pageId = createRes.booking_page.id;
        setEditingPage(createRes.booking_page);
        toast({ title: "Created", description: "Booking page created." });
      }
      
      if (pageId) {
        // Update users: one bookable staff + any CC users
        const combinedUsers: any[] = [];
        if (selectedUserId) {
          combinedUsers.push({ user_id: selectedUserId, is_default: true, priority: 0, is_cc: false });
        }
        ccUserIds
          .filter(user_id => user_id !== selectedUserId)
          .forEach(user_id => {
            combinedUsers.push({ user_id, is_default: false, priority: 0, is_cc: true });
          });

        await api.put(`/booking-pages/${pageId}/users`, {
          users: combinedUsers
        });
        
        // Update stores
        await api.put(`/booking-pages/${pageId}/stores`, {
          store_ids: selectedStoreIds
        });
        
        // Update email templates
        const triggers = [];
        for (const [trigger_type, template_id] of Object.entries(emailTriggers)) {
          if (template_id && template_id !== "none") {
            triggers.push({ trigger_type, template_id });
          }
        }
        await api.put(`/booking-pages/${pageId}/email-templates`, { triggers });
      }

      fetchData();
      setIsDialogOpen(false);
      setEditingPage(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (page: BookingPageData) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      slug: page.slug,
      timezone: page.timezone || "UTC",
      buffer_time_minutes: page.buffer_time_minutes || 0,
      description: page.description || "",
      is_active: page.is_active,
      slot_duration_minutes: page.slot_duration_minutes || 60,
      booking_window_days: page.booking_window_days || 30,
      show_map_in_email: page.show_map_in_email !== undefined ? page.show_map_in_email : true,
      map_url: page.map_url || "",
      map_image_url: page.map_image_url || "",
      lat: page.lat || "",
      lng: page.lng || "",
      edit_appointment_url: page.edit_appointment_url || "",
      cancel_appointment_url: page.cancel_appointment_url || "",
      hours: page.hours && page.hours.length > 0 ? page.hours : Array.from({length: 7}, (_, i) => ({
        day_of_week: i,
        start_time: "09:00",
        end_time: "18:00",
        is_active: i < 5
      })),
      widget_enabled: page.widget_enabled || false,
      allowed_domains: page.allowed_domains || "",
      extra_cc_emails: page.extra_cc_emails || "",
      service_name: page.service_name || "",
    });
    

    const bookableUser = (page.users || []).find(u => !u.is_cc);
    setSelectedUserId(bookableUser?.user_id ?? null);
    setCcUserIds((page.users || []).filter(u => u.is_cc).map(u => u.user_id));
    setSelectedStoreIds((page.stores || []).map(st => st.store_id));
    
    // Load email templates
    const currentTriggers = { confirmation: "none", update: "none", cancellation: "none", reminder: "none" };
    (page.email_templates || []).forEach(et => {
      if (et.trigger_type in currentTriggers) {
        (currentTriggers as any)[et.trigger_type] = et.template_id;
      }
    });
    setEmailTriggers(currentTriggers);
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/booking-pages/${id}`);
      toast({ title: "Deleted", description: "Booking page deleted" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openNewPage = () => {
    setEditingPage(null);
    setFormData({
      name: "",
      slug: "",
      timezone: "UTC",
      buffer_time_minutes: 0,
      description: "",
      is_active: true,
      slot_duration_minutes: 60,
      booking_window_days: 30,
      show_map_in_email: true,
      map_url: "",
      map_image_url: "",
      lat: "",
      lng: "",
      edit_appointment_url: "",
      cancel_appointment_url: "",
      hours: Array.from({length: 7}, (_, i) => ({
        day_of_week: i,
        start_time: "09:00",
        end_time: "18:00",
        is_active: i < 5
      })),
      widget_enabled: false,
      allowed_domains: "",
      extra_cc_emails: "",
      service_name: "",
    });
    setSelectedUserId(null);
    setCcUserIds([]);
    setSelectedStoreIds([]);
    setEmailTriggers({ confirmation: "none", update: "none", cancellation: "none", reminder: "none" });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!editingPage) {
      toast({ title: "Save First", description: "Save the booking page before uploading an image.", variant: "destructive" });
      return;
    }
    setIsUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const res = await api.postFormData(`/auth/booking-pages/${editingPage.id}/upload-image`, formDataUpload);
      setFormData(prev => ({ ...prev, map_image_url: res.image_url }));
      toast({ title: "Image Uploaded", description: "Image uploaded successfully." });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleArrayItem = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredPages = pages.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const daysLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Booking Pages</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your public event types, staff, locations, and triggers.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={openNewPage}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking Page
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search booking pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <LoadingSpinner size={48} />
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm border border-border">
            No booking pages found
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPages.map((page) => (
              <div key={page.id} className="rounded-xl bg-card p-6 shadow-sm border border-border">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LayoutTemplate className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-semibold text-card-foreground truncate">{page.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono truncate">
                        /{page.slug}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(`/book/${page.slug}`, '_blank')}>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        View Live Page
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(page)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Options
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(page.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Page
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {page.stores?.length || 0} Locations
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {page.users?.length || 0} Staff
                    </Badge>

                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                  <Badge variant={page.is_active ? "default" : "secondary"}>
                    {page.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="link" className="p-0 h-auto" onClick={() => window.open(`/book/${page.slug}`, '_blank')}>
                    /book/{page.slug} 
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPage ? "Edit Booking Page" : "Configure Event Type"}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="widget">Widget</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 min-h-[400px]">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Event Name</Label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. VIP Consultation" />
                    </div>
                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Input value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})} placeholder="e.g. Consultation, Hair Cut, Repair..." />
                      <p className="text-[10px] text-muted-foreground italic">Default service label for appointments booked through this page</p>
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">/book/</span>
                        <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="vip-consult" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={formData.description} className="h-[100px]" onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Publicly visible instructions" />
                    </div>
                    <div className="space-y-2">
                      <Label>Page Image</Label>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <Upload className="h-4 w-4 mr-2 animate-pulse" />
                          ) : (
                            <Image className="h-4 w-4 mr-2" />
                          )}
                          {isUploadingImage ? "Uploading..." : "Upload Image"}
                        </Button>
                        {formData.map_image_url && (
                          <a href={formData.map_image_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[160px]">
                            View image
                          </a>
                        )}
                      </div>
                      {formData.map_image_url && (
                        <img src={formData.map_image_url} alt="Page" className="mt-2 h-20 w-auto rounded-lg border object-cover" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="active" checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: !!v})} />
                      <Label htmlFor="active" className="cursor-pointer">This event type is active</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scheduling" className="space-y-6 min-h-[400px]">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Weekly Schedule</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {daysLabels.map((dayName, idx) => {
                        const dayData = formData.hours?.find(h => h.day_of_week === idx) || {
                          day_of_week: idx,
                          start_time: "09:00",
                          end_time: "18:00",
                          is_active: false
                        };
                        
                        return (
                          <div key={idx} className="flex items-center gap-4 p-2 rounded-lg border bg-muted/20">
                            <div className="flex items-center gap-2 w-32">
                              <Checkbox 
                                checked={dayData.is_active} 
                                onCheckedChange={(checked) => {
                                  const newHours = [...(formData.hours || [])];
                                  const existingIdx = newHours.findIndex(h => h.day_of_week === idx);
                                  if (existingIdx >= 0) {
                                    newHours[existingIdx] = { ...newHours[existingIdx], is_active: !!checked };
                                  } else {
                                    newHours.push({ day_of_week: idx, start_time: "09:00", end_time: "18:00", is_active: !!checked });
                                  }
                                  setFormData({ ...formData, hours: newHours });
                                }} 
                              />
                              <Label className="text-sm font-medium">{dayName}</Label>
                            </div>
                            
                            {dayData.is_active ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input 
                                  type="time" 
                                  className="h-8 w-32" 
                                  value={dayData.start_time} 
                                  onChange={(e) => {
                                    const newHours = [...(formData.hours || [])];
                                    const existingIdx = newHours.findIndex(h => h.day_of_week === idx);
                                    newHours[existingIdx] = { ...newHours[existingIdx], start_time: e.target.value };
                                    setFormData({ ...formData, hours: newHours });
                                  }}
                                />
                                <span className="text-muted-foreground">to</span>
                                <Input 
                                  type="time" 
                                  className="h-8 w-32" 
                                  value={dayData.end_time} 
                                  onChange={(e) => {
                                    const newHours = [...(formData.hours || [])];
                                    const existingIdx = newHours.findIndex(h => h.day_of_week === idx);
                                    newHours[existingIdx] = { ...newHours[existingIdx], end_time: e.target.value };
                                    setFormData({ ...formData, hours: newHours });
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Closed / Unavailable</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Slot Duration</Label>
                        <Select value={formData.slot_duration_minutes.toString()} onValueChange={v => setFormData({...formData, slot_duration_minutes: parseInt(v)})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[15, 30, 45, 60, 90, 120].map(m => (
                              <SelectItem key={m} value={m.toString()}>{m} minutes</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Break Between Appointments</Label>
                        <Select value={formData.buffer_time_minutes.toString()} onValueChange={v => setFormData({...formData, buffer_time_minutes: parseInt(v)})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No break</SelectItem>
                            {[5, 10, 15, 20, 30, 45, 60].map(m => (
                              <SelectItem key={m} value={m.toString()}>{m} minutes</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic">Extra time blocked before and after each booking — gives staff time to prepare or wrap up</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Booking Window (days)</Label>
                        <Select value={formData.booking_window_days.toString()} onValueChange={v => setFormData({...formData, booking_window_days: parseInt(v)})}>
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select booking window" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">1 week</SelectItem>
                            <SelectItem value="14">2 weeks</SelectItem>
                            <SelectItem value="30">1 month</SelectItem>
                            <SelectItem value="60">2 months</SelectItem>
                            <SelectItem value="180">6 months</SelectItem>
                            <SelectItem value="270">9 months</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic">How far in advance clients can book appointments</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Action URLs</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">External Edit Action URL</Label>
                          <Input value={formData.edit_appointment_url} onChange={e => setFormData({...formData, edit_appointment_url: e.target.value})} placeholder="/manage/edit" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">External Cancel Action URL</Label>
                          <Input value={formData.cancel_appointment_url} onChange={e => setFormData({...formData, cancel_appointment_url: e.target.value})} placeholder="/manage/cancel" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-b pb-2 pt-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Map in Emails</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium cursor-pointer" htmlFor="show_map_email">Show location map in emails</Label>
                          <p className="text-[11px] text-muted-foreground">When enabled, the map image uploaded in the General tab will appear in confirmation, update, cancellation and reminder emails.</p>
                        </div>
                        <Checkbox
                          id="show_map_email"
                          checked={formData.show_map_in_email}
                          onCheckedChange={v => setFormData({...formData, show_map_in_email: !!v})}
                          className="ml-4 flex-shrink-0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Map Link URL</Label>
                        <Input
                          value={formData.map_url}
                          onChange={e => setFormData({...formData, map_url: e.target.value})}
                          placeholder="https://maps.google.com/?q=..."
                        />
                        <p className="text-[10px] text-muted-foreground italic">The map image will link to this URL when clicked in the email.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6 min-h-[400px]">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4" /> Locations
                    </Label>
                    <div className="border rounded-md p-3 h-[300px] overflow-y-auto space-y-2 bg-muted/20">
                      {allStores.map(store => (
                        <label key={store.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded transition-colors">
                          <Checkbox checked={selectedStoreIds.includes(store.id)} onCheckedChange={() => toggleArrayItem(store.id, setSelectedStoreIds)} />
                          <span className="text-sm">{store.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 mb-3 font-semibold text-primary">
                      <Users className="h-4 w-4" /> Bookable Staff
                    </Label>
                    <div className="border rounded-md p-3 h-[300px] overflow-y-auto space-y-2 bg-muted/20">
                      <RadioGroup
                        value={selectedUserId ?? ""}
                        onValueChange={(val) => {
                          setSelectedUserId(val || null);
                          setCcUserIds(prev => prev.filter(id => id !== val));
                        }}
                      >
                        {allUsers.map(user => (
                          <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded transition-colors">
                            <RadioGroupItem value={user.id} id={`staff-${user.id}`} />
                            <span className="text-sm">{user.name}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 mb-3 font-semibold text-blue-600">
                      <Mail className="h-4 w-4" /> Send Copy To (BCC)
                    </Label>
                    <div className="border rounded-md p-3 h-[300px] overflow-y-auto space-y-2 bg-muted/20">
                      {allUsers.filter(user => user.id !== selectedUserId).map(user => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded transition-colors">
                          <Checkbox
                            checked={ccUserIds.includes(user.id)}
                            onCheckedChange={() => toggleArrayItem(user.id, setCcUserIds)}
                          />
                          <span className="text-sm">{user.name}</span>
                        </label>
                      ))}
                      {allUsers.filter(user => user.id !== selectedUserId).length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-2">No other users available for CC.</p>
                      )}
                    </div>

                    <div className="pt-2 space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">External Emails (BCC)</Label>
                      <Textarea 
                        placeholder="email1@example.com, email2@example.com"
                        className="h-20 text-sm"
                        value={formData.extra_cc_emails}
                        onChange={e => setFormData({...formData, extra_cc_emails: e.target.value})}
                      />
                      <p className="text-[10px] text-muted-foreground italic">Separate multiple emails with commas.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="triggers" className="space-y-6 min-h-[400px]">
                <div className="max-w-md mx-auto space-y-4 pt-6">
                  {[
                    { id: "confirmation", label: "Booking Confirmation" },
                    { id: "update", label: "Appointment Update" },
                    { id: "cancellation", label: "Cancellation Notice" },
                    { id: "reminder", label: "Booking Reminder" }
                  ].map(trigger => (
                    <div key={trigger.id} className="space-y-1">
                      <Label className="text-sm">{trigger.label}</Label>
                      <Select value={(emailTriggers as any)[trigger.id]} onValueChange={v => setEmailTriggers({...emailTriggers, [trigger.id]: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Disabled)</SelectItem>
                          {allTemplates.filter(t => t.type === trigger.id).map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="widget" className="space-y-6 min-h-[400px]">
                <div className="grid gap-6 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Checkbox id="widget_enabled" checked={formData.widget_enabled} onCheckedChange={v => setFormData({...formData, widget_enabled: !!v})} />
                       <Label htmlFor="widget_enabled" className="cursor-pointer">Enable Widget for this Booking Page</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Allowed Domains (Comma separated)</Label>
                      <Input value={formData.allowed_domains} onChange={e => setFormData({...formData, allowed_domains: e.target.value})} placeholder="example.com, app.example.com" />
                    </div>
                  </div>
                  {formData.widget_enabled && formData.slug && (
                    <div className="space-y-4 mt-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Widget Public URL</Label>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={`${window.location.origin}/book/${formData.slug}`} className="bg-muted/50 font-mono text-sm" />
                          <Button variant="outline" size="icon" onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/book/${formData.slug}`);
                            toast({ title: "Copied!", description: "Widget URL copied to clipboard." });
                          }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>API Requests URL</Label>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={editingPage ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/booking-pages/${editingPage.id}` : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/booking-pages/[save-to-generate-id]`} className="bg-muted/50 font-mono text-sm" />
                          <Button variant="outline" size="icon" onClick={() => {
                            if (!editingPage) return toast({ title: "Save First", description: "Save the page to generate the ID URL." });
                            navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/booking-pages/${editingPage.id}`);
                            toast({ title: "Copied!", description: "API URL copied to clipboard." });
                          }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {client?.id && (
                        <div className="space-y-2">
                          <Label>Client Booking Pages List URL</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/booking-pages/client/${client.id}`}
                              className="bg-muted/50 font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/booking-pages/client/${client.id}`);
                                toast({ title: "Copied!", description: "Client listing URL copied to clipboard." });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic">Returns all active booking pages for your account — use this to list pages in an external integration.</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Embed Code</Label>
                        <div className="p-4 bg-muted/30 border rounded-md relative text-sm font-mono break-all text-muted-foreground pr-12">
                          {`<script src="${window.location.origin}/widget.js" data-booking-page-slug="${formData.slug}" data-booking-page-id="${editingPage?.id || '[save-to-generate-id]'}"></script>`}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-2 h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(`<script src="${window.location.origin}/widget.js" data-booking-page-slug="${formData.slug}" data-booking-page-id="${editingPage?.id || '[save-to-generate-id]'}"></script>`);
                              toast({ title: "Copied!", description: "Embed code copied to clipboard." });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
