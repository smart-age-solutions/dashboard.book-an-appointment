import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Mail, Eye, Code, Users, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  type: string;
  ccRecipients: string[];
}

// Mock users for CC selection
const initialUsers: any[] = [];

const templateTypes = [
  { value: "confirmation", label: "Booking Confirmation" },
  { value: "update", label: "Appointment Update" },
  { value: "reminder", label: "Appointment Reminder" },
  { value: "cancellation", label: "Cancellation Notice" },
  { value: "thank_you", label: "Thank You / Follow-up" },
  { value: "custom", label: "Custom" },
];

const initialTemplates: EmailTemplate[] = [];

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [editorTab, setEditorTab] = useState<"visual" | "html">("html");
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body_html: "",
    type: "confirmation",
    ccRecipients: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templateData, userData] = await Promise.all([
        api.get("/email-templates"),
        api.get("/teams/all-members"),
      ]);

      const backendTemplates = templateData.templates;
      setTemplates(backendTemplates.map((t: any) => ({
        ...t,
        ccRecipients: t.ccRecipients || []
      })));
      setAvailableUsers(userData.users);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body_html) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        subject: formData.subject,
        body_html: formData.body_html,
        type: formData.type,
        ccRecipients: formData.ccRecipients,
      };

      if (editingTemplate) {
        await api.put(`/email-templates/${editingTemplate.id}`, payload);
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        await api.post("/email-templates", payload);
        toast({ title: "Success", description: "Template created successfully" });
      }

      fetchTemplates();
      setIsDialogOpen(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      type: template.type,
      ccRecipients: template.ccRecipients,
    });
    setIsDialogOpen(true);
  };

  const toggleRecipient = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      ccRecipients: prev.ccRecipients.includes(userId)
        ? prev.ccRecipients.filter((id) => id !== userId)
        : [...prev.ccRecipients, userId],
    }));
  };

  const getRecipientNames = (ids: string[]) => {
    return ids
      .map((id) => availableUsers.find((u) => u.id === id)?.name)
      .filter(Boolean);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      await api.delete(`/email-templates/${id}`);
      toast({ title: "Deleted", description: "Template deleted successfully" });
      fetchTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #a6cd39;">Your Title Here</h1>
  <p>Dear <strong>{{client_name}}</strong>,</p>
  <p>Your content here...</p>
  <p>Best regards,<br><strong>{{store_name}}</strong></p>
</div>`,
      type: "confirmation",
      ccRecipients: [],
    });
    setIsDialogOpen(true);
  };

  const getPreviewContent = (content: string) => {
    const mockContext: any = {
      name: "John Doe",
      client_name: "John Doe",
      service: "Hair Styling",
      date: "January 15, 2026",
      time: "10:00 AM",
      company_name: "Smart Age Solutions",
      store_address: "123 Main Street, City",
      appointment_id: "apt_123456",
      edit_url: "#",
      cancel_url: "#",
      logo_url: "https://placehold.co/200x50",
      brand_color: "#a6cd39",
      first_name: "John",
      last_name: "Doe",
      title: "Mr.",
      store_url: "#",
      store_phone: "555-0123",
      map_url: "https://maps.google.com/q=123+Main+St",
      map_image_url: "https://placehold.co/600x400?text=Map+Preview",
      lat: "40.7128",
      lng: "-74.0060",
      latitude: "40.7128",
      longitude: "-74.0060",
      show_map: true,
      preferred_communication: "Email",
      cancellation_reason: "Schedule conflict",
      notes: "Please be on time.",
      show_previous_details: true,
      old_date: "January 14, 2026",
      old_time: "09:00 AM",
      inviter_name: "Jane Smith",
      invite_url: "#",
      reset_url: "#",
    };

    let processed = content;

    // 1. Handle {% if ... %} blocks (Simple implementation for preview)
    const ifBlockRegex = /{% *if +([^%]+) *%}([\s\S]*?){% *endif *%}/g;
    processed = processed.replace(ifBlockRegex, (_, condition, body) => {
      const trimmedCondition = condition.trim();
      const isNot = trimmedCondition.startsWith("not ");
      const varName = isNot
        ? trimmedCondition.substring(4).trim()
        : trimmedCondition;

      // Check if variable exists and is truthy in mock context
      const value = mockContext[varName];
      const isTrue = isNot ? !value : !!value;

      return isTrue ? body : "";
    });

    // 2. Handle {{ variable }} replacements
    return processed.replace(/{{ *([\w_.]+) *}}/g, (match, varName) => {
      // Handle simple property access if needed, but for now just flat mapping
      return mockContext[varName] !== undefined
        ? String(mockContext[varName])
        : match;
    });
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <LoadingSpinner size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Email Templates
            </h1>
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
        {(user?.email?.endsWith("@smartagesolutions.com") || user?.email?.endsWith("@smartasolutions.com")) && (
          <div className="rounded-lg bg-accent/50 border border-primary/20 p-4">
            <p className="text-sm font-medium text-card-foreground mb-2">
              Available Variables (use in HTML):
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "{{name}}",
                "{{client_name}}",
                "{{service}}",
                "{{date}}",
                "{{time}}",
                "{{company_name}}",
                "{{store_address}}",
                "{{appointment_id}}",
                "{{edit_url}}",
                "{{cancel_url}}",
                "{{logo_url}}",
                "{{brand_color}}",
                "{{first_name}}",
                "{{last_name}}",
                "{{title}}",
                "{{store_url}}",
                "{{store_phone}}",
                "{{map_url}}",
                "{{map_image_url}}",
                "{{lat}}",
                "{{lng}}",
                "{{latitude}}",
                "{{longitude}}",
                "{{show_map}}",
                "{{preferred_communication}}",
                "{{cancellation_reason}}",
              ].map((v) => (
                <code
                  key={v}
                  className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground font-mono"
                >
                  {v}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl bg-card p-6 card-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <Mail className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {
                        templateTypes.find((t) => t.value === template.type)
                          ?.label
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    HTML
                  </Badge>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-card-foreground mb-1">
                  Subject:
                </p>
                <p className="text-sm text-muted-foreground">
                  {template.subject}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-card-foreground mb-1">
                  Preview:
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stripHtml(getPreviewContent(template.body_html)).slice(0, 120)}...
                </p>
              </div>
              {template.ccRecipients.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    BCC Recipients:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getRecipientNames(template.ccRecipients).map(
                      (name, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {name}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(template.id)}
                >
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
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "New Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Booking Confirmation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="e.g., Your appointment has been confirmed"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Body (HTML)</Label>
                  <Tabs
                    value={editorTab}
                    onValueChange={(v) => setEditorTab(v as "visual" | "html")}
                  >
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
                    value={formData.body_html}
                    onChange={(e) =>
                      setFormData({ ...formData, body_html: e.target.value })
                    }
                    placeholder="<div>Enter your HTML email content here...</div>"
                  />
                ) : (
                  <div
                    className="border border-border rounded-lg p-4 min-h-[300px] bg-card overflow-auto"
                    dangerouslySetInnerHTML={{
                      __html: getPreviewContent(formData.body_html),
                    }}
                  />
                )}
              </div>

              {/* CC Recipients Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label>Send Copy To (BCC)</Label>
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
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  isLoading={isSubmitting}
                >
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    dangerouslySetInnerHTML={{
                      __html: getPreviewContent(previewTemplate.body_html),
                    }}
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
