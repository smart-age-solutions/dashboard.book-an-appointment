import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Mail, Eye, Code, Users, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive: boolean;
  ccRecipients: string[];
}

// Mock users for CC selection
const initialUsers: any[] = [];

const templateTypes = [
  { value: "confirmation", label: "Booking Confirmation" },
  { value: "update", label: "Appointment Update" },
  { value: "reminder", label: "Appointment Reminder" },
  { value: "cancellation", label: "Cancellation Notice" },
  { value: "follow-up", label: "Follow-up" },
  { value: "custom", label: "Custom" },
];

const initialTemplates: EmailTemplate[] = [];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editorTab, setEditorTab] = useState<"visual" | "html">("html");
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    type: "confirmation",
    isActive: true,
    ccRecipients: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templateData, userData] = await Promise.all([
        api.get("/auth/settings/email-templates"),
        api.get("/teams/all-members") // Use the new generic route
      ]);
      
      const backendTemplates = templateData.templates;
      const mapped: EmailTemplate[] = [
        {
          id: "confirmation",
          name: "Booking Confirmation",
          subject: "Your appointment has been confirmed",
          body: backendTemplates.confirmation || "",
          type: "confirmation",
          isActive: !!backendTemplates.confirmation,
          ccRecipients: backendTemplates.confirmation_cc || []
        },
        {
          id: "update",
          name: "Appointment Update",
          subject: "Your appointment has been updated",
          body: backendTemplates.update || "",
          type: "update",
          isActive: !!backendTemplates.update,
          ccRecipients: backendTemplates.update_cc || []
        },
        {
          id: "cancellation",
          name: "Cancellation Notice",
          subject: "Appointment Cancelled",
          body: backendTemplates.cancellation || "",
          type: "cancellation",
          isActive: !!backendTemplates.cancellation,
          ccRecipients: backendTemplates.cancellation_cc || []
        },
        {
          id: "thank_you",
          name: "Thank You Message",
          subject: "Thank you for visiting",
          body: backendTemplates.thank_you || "",
          type: "thank_you",
          isActive: !!backendTemplates.thank_you,
          ccRecipients: backendTemplates.thank_you_cc || []
        },
        {
          id: "reminder",
          name: "Appointment Reminder",
          subject: "Reminder: Your upcoming appointment",
          body: backendTemplates.reminder || "",
          type: "reminder",
          isActive: !!backendTemplates.reminder,
          ccRecipients: backendTemplates.reminder_cc || []
        }
      ].filter(t => t.body); // Only show ones that exist or show all? Let's show all.

      setTemplates(mapped);
      setAvailableUsers(userData.users);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      const payload: any = {};
      if (formData.type === "confirmation") {
        payload.confirmation_template = formData.body;
        payload.confirmation_cc = formData.ccRecipients;
      }
      if (formData.type === "update") {
        payload.update_template = formData.body;
        payload.update_cc = formData.ccRecipients;
      }
      if (formData.type === "cancellation") {
        payload.cancellation_template = formData.body;
        payload.cancellation_cc = formData.ccRecipients;
      }
      if (formData.type === "thank_you") {
        payload.thank_you_template = formData.body;
        payload.thank_you_cc = formData.ccRecipients;
      }
      if (formData.type === "reminder") {
        payload.reminder_template = formData.body;
        payload.reminder_cc = formData.ccRecipients;
      }

      await api.put("/auth/settings/email-templates", payload);
      toast({ title: "Success", description: "Template saved successfully" });
      fetchTemplates();
      setIsDialogOpen(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      isActive: template.isActive,
      ccRecipients: template.ccRecipients,
    });
    setIsDialogOpen(true);
  };

  const toggleRecipient = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      ccRecipients: prev.ccRecipients.includes(userId)
        ? prev.ccRecipients.filter(id => id !== userId)
        : [...prev.ccRecipients, userId]
    }));
  };

  const getRecipientNames = (ids: string[]) => {
    return ids.map(id => availableUsers.find(u => u.id === id)?.name).filter(Boolean);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({ title: "Deleted", description: "Template deleted successfully" });
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setFormData({ 
      name: "", 
      subject: "", 
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #a6cd39;">Your Title Here</h1>
  <p>Dear <strong>{{client_name}}</strong>,</p>
  <p>Your content here...</p>
  <p>Best regards,<br><strong>{{store_name}}</strong></p>
</div>`, 
      type: "confirmation", 
      isActive: true,
      ccRecipients: [],
    });
    setIsDialogOpen(true);
  };

  const getPreviewContent = (content: string) => {
    return content
      .replace(/{{name}}/g, "John Doe")
      .replace(/{{client_name}}/g, "John Doe")
      .replace(/{{service}}/g, "Hair Styling")
      .replace(/{{date}}/g, "January 15, 2025")
      .replace(/{{time}}/g, "10:00 AM")
      .replace(/{{company_name}}/g, "Smart Age Salon")
      .replace(/{{store_address}}/g, "123 Main Street, City")
      .replace(/{{schedule_id}}/g, "apt_123456")
      .replace(/{{edit_url}}/g, "#")
      .replace(/{{cancel_url}}/g, "#")
      .replace(/{{logo_url}}/g, "https://placehold.co/200x50")
      .replace(/{{brand_color}}/g, "#a6cd39")
      .replace(/{{first_name}}/g, "John")
      .replace(/{{last_name}}/g, "Doe")
      .replace(/{{title}}/g, "Mr.")
      .replace(/{{store_url}}/g, "#")
      .replace(/{{store_phone}}/g, "555-0123");
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
            <p className="mt-1 text-muted-foreground">
              Customize automated emails with HTML support
            </p>
          </div>
          <Button onClick={openNewTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Variables Help */}
        <div className="rounded-lg bg-accent/50 border border-primary/20 p-4">
          <p className="text-sm font-medium text-card-foreground mb-2">Available Variables (use in HTML):</p>
          <div className="flex flex-wrap gap-2">
            {[
              "{{name}}", 
              "{{client_name}}", 
              "{{service}}", 
              "{{date}}", 
              "{{time}}", 
              "{{company_name}}", 
              "{{store_address}}",
              "{{schedule_id}}",
              "{{edit_url}}",
              "{{cancel_url}}",
              "{{logo_url}}",
              "{{brand_color}}",
              "{{first_name}}",
              "{{last_name}}",
              "{{title}}",
              "{{store_url}}",
              "{{store_phone}}"
            ].map((v) => (
              <code key={v} className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground font-mono">
                {v}
              </code>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <Mail className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {templateTypes.find(t => t.value === template.type)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    HTML
                  </Badge>
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-card-foreground mb-1">Subject:</p>
                <p className="text-sm text-muted-foreground">{template.subject}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-card-foreground mb-1">Preview:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stripHtml(template.body).slice(0, 120)}...
                </p>
              </div>
              {template.ccRecipients.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    CC Recipients:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getRecipientNames(template.ccRecipients).map((name, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePreview(template)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Booking Confirmation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Your appointment has been confirmed"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Body (HTML)</Label>
                  <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "visual" | "html")}>
                    <TabsList className="h-8">
                      <TabsTrigger value="html" className="text-xs px-3 h-6">
                        <Code className="h-3 w-3 mr-1" />
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="visual" className="text-xs px-3 h-6">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {editorTab === "html" ? (
                  <Textarea
                    rows={15}
                    className="font-mono text-sm"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="<div>Enter your HTML email content here...</div>"
                  />
                ) : (
                  <div 
                    className="border border-border rounded-lg p-4 min-h-[300px] bg-card overflow-auto"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent(formData.body) }}
                  />
                )}
              </div>
              
              {/* CC Recipients Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label>Send Copy To (CC)</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select team members who will receive a copy of this email
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.ccRecipients.includes(user.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleRecipient(user.id)}
                    >
                      <Checkbox
                        checked={formData.ccRecipients.includes(user.id)}
                        onCheckedChange={() => toggleRecipient(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="py-4">
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted px-4 py-3 border-b border-border">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p className="font-medium text-card-foreground">
                      {getPreviewContent(previewTemplate.subject)}
                    </p>
                  </div>
                  <div 
                    className="p-6 bg-card"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent(previewTemplate.body) }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
