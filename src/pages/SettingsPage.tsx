import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Save, Store, Clock, Mail, Phone, MapPin, Globe, Key, Server, Copy, CheckCircle2, AlertCircle, MessageSquare, Link, XCircle, Plus, Trash2, Edit2, Building2, Palette, Upload, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useStores, Store as StoreType, StoreHours, defaultHours } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";

type EmailProvider = "aws_ses_api" | "aws_ses_smtp" | "gmail_smtp" | "mailgun_api" | "mailgun_smtp";

type SmsProvider = "aws_sns" | "twilio";

interface SmsConfig {
  provider: SmsProvider;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
}

interface EmailConfig {
  provider: EmailProvider;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  mailgunApiKey: string;
  mailgunDomain: string;
  senderDomain: string;
  verificationToken: string;
  dkimTokens: string[];
  mailFromDomain: string;
  isDomainVerified: boolean;
}

const initialEmailConfig: EmailConfig = {
  provider: "aws_ses_api",
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  awsRegion: "us-east-1",
  smtpHost: "",
  smtpPort: "587",
  smtpUsername: "",
  smtpPassword: "",
  smtpSecure: true,
  mailgunApiKey: "",
  mailgunDomain: "",
  senderDomain: "",
  verificationToken: "",
  dkimTokens: [],
  mailFromDomain: "",
  isDomainVerified: false,
};

const initialSmsConfig: SmsConfig = {
  provider: "aws_sns",
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  awsRegion: "us-east-1",
  twilioAccountSid: "",
  twilioAuthToken: "",
  twilioPhoneNumber: "",
};

export default function SettingsPage() {
  const { stores, addStore, updateStore, deleteStore } = useStores();
  const { isBackofficeUser } = useAuth();
  
  const [notifications, setNotifications] = useState({
    emailConfirmation: true,
    emailReminder: true,
    emailCancellation: true,
    smsReminder: false,
    reminderHours: "24",
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>(initialEmailConfig);
  const [smsConfig, setSmsConfig] = useState<SmsConfig>(initialSmsConfig);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Store dialog state
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    isActive: true,
    hours: [...defaultHours],
    slotDuration: "60",
  });

  // Global settings
  const [globalSettings, setGlobalSettings] = useState({
    website: "",
    description: "",
    editAppointmentUrl: "",
    cancelAppointmentUrl: "",
    primaryColor: "#a6cd39",
    logoUrl: "",
    timezone: "America/New_York",
    bookingWindowDays: "30",
    slotDuration: "60",
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Time slots configuration
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  const toggleTimeSlotDay = (index: number) => {
    setTimeSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, isOpen: !slot.isOpen } : slot
    ));
  };

  const updateTimeSlot = (index: number, field: "startTime" | "endTime", value: string) => {
    setTimeSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSaveNotifications = () => {
    toast({ title: "Saved", description: "Notification settings updated successfully" });
  };

  const handleSaveEmailConfig = async () => {
    try {
      await api.put("/auth/settings/email-config", emailConfig);
      toast({ title: "Saved", description: "Email service configuration saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save email config", variant: "destructive" });
    }
  };

  const handleSaveSmsConfig = async () => {
    try {
      await api.put("/auth/settings/sms-config", smsConfig);
      toast({ title: "Saved", description: "SMS service configuration saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save sms config", variant: "destructive" });
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const [brandingData, profileData] = await Promise.all([
        api.get("/auth/settings/branding"),
        api.get("/auth/settings/profile")
      ]);

      setGlobalSettings({
        ...globalSettings,
        primaryColor: brandingData.branding.brand_color || "#a6cd39",
        logoUrl: brandingData.branding.logo_url || "",
        website: profileData.profile.website || "",
        description: profileData.profile.description || "",
        bookingWindowDays: String(profileData.profile.booking_window_days || "30"),
        timezone: profileData.profile.timezone || "America/New_York",
        editAppointmentUrl: profileData.profile.edit_appointment_url || "",
        cancelAppointmentUrl: profileData.profile.cancel_appointment_url || "",
      });

      // Fetch Email & SMS configs
      try {
        const [emailRes, smsRes] = await Promise.all([
          api.get("/auth/settings/email-config"),
          api.get("/auth/settings/sms-config")
        ]);
        
        if (emailRes.email_config && Object.keys(emailRes.email_config).length > 0) {
          setEmailConfig({ ...initialEmailConfig, ...emailRes.email_config });
        }
        if (smsRes.sms_config && Object.keys(smsRes.sms_config).length > 0) {
          setSmsConfig({ ...initialSmsConfig, ...smsRes.sms_config });
        }
      } catch (e) {
        console.error("Failed to fetch service configs", e);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    }
  };

  const handleUploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.postFormData("/auth/upload/logo", formData);
      
      setGlobalSettings(prev => ({ ...prev, logoUrl: response.logo_url }));
      toast({ title: "Uploaded", description: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const handleSaveGlobalSettings = async () => {
    try {
      await Promise.all([
        api.put("/auth/settings/branding", {
          brand_color: globalSettings.primaryColor,
          logo_url: globalSettings.logoUrl.startsWith("blob:") ? undefined : globalSettings.logoUrl,
        }),
        api.put("/auth/settings/profile", {
          company_name: "SmartAppointment Client",
          booking_window_days: parseInt(globalSettings.bookingWindowDays),
          timezone: globalSettings.timezone,
          edit_appointment_url: globalSettings.editAppointmentUrl,
          cancel_appointment_url: globalSettings.cancelAppointmentUrl,
        })
      ]);
      toast({ title: "Saved", description: "Global settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleVerifyDomain = () => {
    toast({ title: "Verification Requested", description: "Domain verification process initiated." });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied", description: "Value copied to clipboard" });
  };

  const openNewStore = () => {
    setEditingStore(null);
    setStoreFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      isActive: true,
      hours: [...defaultHours],
      slotDuration: globalSettings.slotDuration,
    });
    setIsStoreDialogOpen(true);
  };

  const openEditStore = (store: StoreType) => {
    setEditingStore(store);
    setStoreFormData({
      name: store.name,
      email: store.email,
      phone: store.phone,
      address: store.address,
      city: store.city,
      state: store.state,
      zip: store.zip,
      isActive: store.isActive,
      hours: [...store.hours],
      slotDuration: (store as any).slotDuration || globalSettings.slotDuration,
    });
    setIsStoreDialogOpen(true);
  };

  const handleSaveStore = () => {
    if (!storeFormData.name) {
      toast({ title: "Error", description: "Store name is required", variant: "destructive" });
      return;
    }

    if (editingStore) {
      updateStore(editingStore.id, storeFormData);
      toast({ title: "Updated", description: "Store updated successfully" });
    } else {
      addStore(storeFormData);
      toast({ title: "Created", description: "New store added successfully" });
    }
    setIsStoreDialogOpen(false);
  };

  const handleDeleteStore = (storeId: string) => {
    if (stores.length <= 1) {
      toast({ title: "Error", description: "You must have at least one store", variant: "destructive" });
      return;
    }
    deleteStore(storeId);
    toast({ title: "Deleted", description: "Store removed successfully" });
  };

  const toggleStoreHour = (index: number) => {
    const newHours = storeFormData.hours.map((h, i) =>
      i === index ? { ...h, isOpen: !h.isOpen } : h
    );
    setStoreFormData({ ...storeFormData, hours: newHours });
  };

  const updateStoreHour = (index: number, field: "openTime" | "closeTime", value: string) => {
    const newHours = storeFormData.hours.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    setStoreFormData({ ...storeFormData, hours: newHours });
  };

  const getDnsRecords = () => {
    if (!emailConfig.senderDomain || !emailConfig.verificationToken) return [];
    
    const records = [
      {
        type: "TXT",
        name: `_amazonses.${emailConfig.senderDomain}`,
        value: emailConfig.verificationToken,
        purpose: "Domain verification",
      },
    ];

    emailConfig.dkimTokens.forEach((token, idx) => {
      records.push({
        type: "CNAME",
        name: `${token}._domainkey.${emailConfig.senderDomain}`,
        value: `${token}.dkim.amazonses.com`,
        purpose: `DKIM record ${idx + 1}`,
      });
    });

    if (emailConfig.mailFromDomain) {
      records.push({
        type: "MX",
        name: emailConfig.mailFromDomain,
        value: `feedback-smtp.${emailConfig.awsRegion}.amazonses.com`,
        purpose: "Mail FROM domain",
      });
      records.push({
        type: "TXT",
        name: emailConfig.mailFromDomain,
        value: `v=spf1 include:amazonses.com ~all`,
        purpose: "SPF record",
      });
    }

    return records;
  };

  const renderSmsProviderFields = () => {
    switch (smsConfig.provider) {
      case "aws_sns":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>AWS Access Key ID</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="password"
                  placeholder="AKIA..."
                  value={smsConfig.awsAccessKeyId}
                  onChange={(e) => setSmsConfig({ ...smsConfig, awsAccessKeyId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>AWS Secret Access Key</Label>
              <Input
                type="password"
                placeholder="Secret key..."
                value={smsConfig.awsSecretAccessKey}
                onChange={(e) => setSmsConfig({ ...smsConfig, awsSecretAccessKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>AWS Region</Label>
              <Select 
                value={smsConfig.awsRegion} 
                onValueChange={(v) => setSmsConfig({ ...smsConfig, awsRegion: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                  <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                  <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
                  <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "twilio":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account SID</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="password"
                  placeholder="AC..."
                  value={smsConfig.twilioAccountSid}
                  onChange={(e) => setSmsConfig({ ...smsConfig, twilioAccountSid: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Auth Token</Label>
              <Input
                type="password"
                placeholder="Auth token..."
                value={smsConfig.twilioAuthToken}
                onChange={(e) => setSmsConfig({ ...smsConfig, twilioAuthToken: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Twilio Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="+1234567890"
                  value={smsConfig.twilioPhoneNumber}
                  onChange={(e) => setSmsConfig({ ...smsConfig, twilioPhoneNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderProviderFields = () => {
    switch (emailConfig.provider) {
      case "aws_ses_api":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>AWS Access Key ID</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="password"
                  placeholder="AKIA..."
                  value={emailConfig.awsAccessKeyId}
                  onChange={(e) => setEmailConfig({ ...emailConfig, awsAccessKeyId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>AWS Secret Access Key</Label>
              <Input
                type="password"
                placeholder="Secret key..."
                value={emailConfig.awsSecretAccessKey}
                onChange={(e) => setEmailConfig({ ...emailConfig, awsSecretAccessKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>AWS Region</Label>
              <Select 
                value={emailConfig.awsRegion} 
                onValueChange={(v) => setEmailConfig({ ...emailConfig, awsRegion: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                  <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                  <SelectItem value="eu-west-2">Europe (London)</SelectItem>
                  <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                  <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
                  <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "aws_ses_smtp":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="email-smtp.us-east-1.amazonaws.com"
                  value={emailConfig.smtpHost}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Select 
                value={emailConfig.smtpPort} 
                onValueChange={(v) => setEmailConfig({ ...emailConfig, smtpPort: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="587">587 (TLS)</SelectItem>
                  <SelectItem value="2465">2465 (SSL)</SelectItem>
                  <SelectItem value="2587">2587 (TLS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input
                placeholder="SMTP credentials username"
                value={emailConfig.smtpUsername}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                placeholder="SMTP credentials password"
                value={emailConfig.smtpPassword}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
              />
            </div>
          </div>
        );
      case "gmail_smtp":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Use an App Password for Gmail. Enable 2FA and generate one at: Security → 2-Step Verification → App passwords
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gmail Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="email"
                  placeholder="your@gmail.com"
                  value={emailConfig.smtpUsername}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>App Password</Label>
              <Input
                type="password"
                placeholder="16-character app password"
                value={emailConfig.smtpPassword}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
              />
            </div>
          </div>
        );
      case "mailgun_api":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mailgun API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="password"
                  placeholder="key-..."
                  value={emailConfig.mailgunApiKey}
                  onChange={(e) => setEmailConfig({ ...emailConfig, mailgunApiKey: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mailgun Domain</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="mg.yourdomain.com"
                  value={emailConfig.mailgunDomain}
                  onChange={(e) => setEmailConfig({ ...emailConfig, mailgunDomain: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
      case "mailgun_smtp":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="smtp.mailgun.org"
                  value={emailConfig.smtpHost}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Select 
                value={emailConfig.smtpPort} 
                onValueChange={(v) => setEmailConfig({ ...emailConfig, smtpPort: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="587">587 (TLS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input
                placeholder="postmaster@mg.yourdomain.com"
                value={emailConfig.smtpUsername}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                placeholder="Mailgun SMTP password"
                value={emailConfig.smtpPassword}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const dnsRecords = getDnsRecords();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure your stores and appointment preferences
          </p>
        </div>

        <Tabs defaultValue="stores" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            {isBackofficeUser && (
              <>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="email">Email Service</TabsTrigger>
                <TabsTrigger value="sms">SMS Service</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <Building2 className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">Store Locations</h2>
                    <p className="text-sm text-muted-foreground">Manage multiple store locations with individual hours</p>
                  </div>
                </div>
                <Button onClick={openNewStore}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Store
                </Button>
              </div>

              <div className="space-y-4">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className={`p-4 rounded-lg border ${
                      store.isActive ? "bg-accent/30 border-border" : "bg-muted/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${store.isActive ? "text-card-foreground" : "text-muted-foreground"}`}>
                            {store.name}
                          </h3>
                          {!store.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {store.address}, {store.city}, {store.state} {store.zip}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {store.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {store.phone}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {store.hours.filter(h => h.isOpen).map(h => (
                            <span key={h.day} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                              {h.day.slice(0, 3)}: {h.openTime}-{h.closeTime}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditStore(store)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {stores.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteStore(store.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {/* Branding Section */}
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent">
                  <Palette className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Branding</h2>
                  <p className="text-sm text-muted-foreground">Customize your brand appearance</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={globalSettings.primaryColor}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded-md border border-input cursor-pointer"
                    />
                    <Input
                      value={globalSettings.primaryColor}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, primaryColor: e.target.value })}
                      placeholder="#a6cd39"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadLogo(file);
                        }
                      }}
                    />
                    {globalSettings.logoUrl ? (
                      <div className="relative w-16 h-16 rounded-lg border border-input overflow-hidden">
                        <img src={globalSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-input flex items-center justify-center bg-muted/30">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                      {globalSettings.logoUrl ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {globalSettings.logoUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setGlobalSettings({ ...globalSettings, logoUrl: "" })}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={globalSettings.timezone}
                    onValueChange={(v) => setGlobalSettings({ ...globalSettings, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Booking Window</Label>
                  <Select
                    value={globalSettings.bookingWindowDays}
                    onValueChange={(v) => setGlobalSettings({ ...globalSettings, bookingWindowDays: v })}
                  >
                    <SelectTrigger className="w-full">
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
                  <p className="text-xs text-muted-foreground">How far in advance clients can book appointments</p>
                </div>
                <div className="space-y-2">
                  <Label>Default Slot Duration</Label>
                  <Select
                    value={globalSettings.slotDuration}
                    onValueChange={(v) => setGlobalSettings({ ...globalSettings, slotDuration: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Default appointment duration for new stores</p>
                </div>
              </div>
            </div>

            {/* Global Settings */}
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent">
                  <Store className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Global Settings</h2>
                  <p className="text-sm text-muted-foreground">Settings that apply across all stores</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={globalSettings.website}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, website: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={globalSettings.description}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, description: e.target.value })}
                  />
                </div>

                {/* Appointment Action URLs */}
                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-4">Appointment Action URLs</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These URLs will be used in email templates to redirect clients to your website for editing or canceling appointments.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Edit Appointment URL</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="https://yoursite.com/edit-appointment"
                          value={globalSettings.editAppointmentUrl}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, editAppointmentUrl: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Use {"{{appointment_id}}"} as a placeholder in the URL</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cancel Appointment URL</Label>
                      <div className="relative">
                        <XCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="https://yoursite.com/cancel-appointment"
                          value={globalSettings.cancelAppointmentUrl}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, cancelAppointmentUrl: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Use {"{{appointment_id}}"} as a placeholder in the URL</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveGlobalSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Weekly Time Slots - Hidden for now */}
            {/* <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent">
                  <Clock className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Weekly Time Slots</h2>
                  <p className="text-sm text-muted-foreground">Set default available hours for appointments</p>
                </div>
              </div>

              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div
                    key={slot.day}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      slot.isOpen ? "bg-accent/30" : "bg-muted/30"
                    }`}
                  >
                    <div className="w-24">
                      <span className={`text-sm font-medium ${slot.isOpen ? "text-card-foreground" : "text-muted-foreground"}`}>
                        {slot.day.slice(0, 3)}
                      </span>
                    </div>
                    <Switch
                      checked={slot.isOpen}
                      onCheckedChange={() => toggleTimeSlotDay(index)}
                    />
                    {slot.isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                          className="w-32 h-8 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                          className="w-32 h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveGlobalSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div> */}
          </TabsContent>

          {/* Notifications */}
          {isBackofficeUser && (
            <TabsContent value="notifications" className="space-y-6">
              <div className="rounded-xl bg-card p-6 card-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent">
                    <Mail className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">Notification Preferences</h2>
                    <p className="text-sm text-muted-foreground">Configure automated notifications</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-card-foreground">Booking Confirmation</p>
                      <p className="text-sm text-muted-foreground">Send email when booking is confirmed</p>
                    </div>
                    <Switch
                      checked={notifications.emailConfirmation}
                      onCheckedChange={(v) => setNotifications({ ...notifications, emailConfirmation: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-card-foreground">Appointment Reminder</p>
                      <p className="text-sm text-muted-foreground">Send reminder email before appointment</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        className="w-20"
                        value={notifications.reminderHours}
                        onChange={(e) => setNotifications({ ...notifications, reminderHours: e.target.value })}
                      />
                      <span className="text-sm text-muted-foreground">hours before</span>
                      <Switch
                        checked={notifications.emailReminder}
                        onCheckedChange={(v) => setNotifications({ ...notifications, emailReminder: v })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-card-foreground">Cancellation Notice</p>
                      <p className="text-sm text-muted-foreground">Send email when appointment is cancelled</p>
                    </div>
                    <Switch
                      checked={notifications.emailCancellation}
                      onCheckedChange={(v) => setNotifications({ ...notifications, emailCancellation: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-card-foreground">SMS Reminders</p>
                      <p className="text-sm text-muted-foreground">Send text message reminders (requires SMS integration)</p>
                    </div>
                    <Switch
                      checked={notifications.smsReminder}
                      onCheckedChange={(v) => setNotifications({ ...notifications, smsReminder: v })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Email Service Configuration */}
          {isBackofficeUser && (
            <TabsContent value="email" className="space-y-6">
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent">
                  <Server className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Email Service Provider</h2>
                  <p className="text-sm text-muted-foreground">Choose and configure your email sending service</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Email Provider</Label>
                  <Select 
                    value={emailConfig.provider} 
                    onValueChange={(v: EmailProvider) => setEmailConfig({ ...emailConfig, provider: v })}
                  >
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws_ses_api">AWS SES (API)</SelectItem>
                      <SelectItem value="aws_ses_smtp">AWS SES (SMTP)</SelectItem>
                      <SelectItem value="gmail_smtp">Gmail (SMTP)</SelectItem>
                      <SelectItem value="mailgun_api">Mailgun (API)</SelectItem>
                      <SelectItem value="mailgun_smtp">Mailgun (SMTP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderProviderFields()}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveEmailConfig}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>

            {/* Domain Verification & DKIM */}
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent">
                  <Globe className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Domain Verification & DKIM</h2>
                  <p className="text-sm text-muted-foreground">Configure DNS records for sending emails from your domain</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sender Domain</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="yourdomain.com"
                        value={emailConfig.senderDomain}
                        onChange={(e) => setEmailConfig({ ...emailConfig, senderDomain: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="opacity-0">Action</Label>
                    <Button 
                      variant="outline" 
                      onClick={handleVerifyDomain}
                      disabled={!emailConfig.senderDomain}
                      className="w-full"
                    >
                      Generate DNS Records
                    </Button>
                  </div>
                </div>

                {/* Domain Verification Status */}
                {emailConfig.senderDomain && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    emailConfig.isDomainVerified 
                      ? "bg-green-500/10 border border-green-500/20" 
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}>
                    {emailConfig.isDomainVerified ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Domain verified and ready to send emails
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-600 dark:text-amber-400">
                          Domain pending verification. Add the DNS records below to your domain.
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* DNS Records Table */}
                {dnsRecords.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-card-foreground">Required DNS Records</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Value</th>
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Purpose</th>
                            <th className="py-2 px-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {dnsRecords.map((record, idx) => (
                            <tr key={idx} className="border-b border-border/50">
                              <td className="py-3 px-3">
                                <span className="px-2 py-1 rounded bg-muted text-xs font-mono">
                                  {record.type}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <code className="text-xs break-all">{record.name}</code>
                              </td>
                              <td className="py-3 px-3 max-w-xs">
                                <code className="text-xs break-all">{record.value}</code>
                              </td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {record.purpose}
                              </td>
                              <td className="py-3 px-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(record.value, `dns-${idx}`)}
                                >
                                  {copiedField === `dns-${idx}` ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          )}

          {/* SMS Service Configuration */}
          {isBackofficeUser && (
            <TabsContent value="sms" className="space-y-6">
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent">
                  <MessageSquare className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">SMS Service Provider</h2>
                  <p className="text-sm text-muted-foreground">Choose and configure your SMS sending service</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Select 
                    value={smsConfig.provider} 
                    onValueChange={(v: SmsProvider) => setSmsConfig({ ...smsConfig, provider: v })}
                  >
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws_sns">AWS SNS (Simple Notification Service)</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderSmsProviderFields()}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveSmsConfig}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>

            {/* SMS Usage Notes */}
            <div className="rounded-xl bg-card p-6 card-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent">
                  <AlertCircle className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">Important Notes</h2>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {smsConfig.provider === "aws_sns" ? (
                  <>
                    <p>• AWS SNS SMS is available in select regions. Check AWS documentation for supported regions.</p>
                    <p>• You may need to request a spending limit increase from AWS for production use.</p>
                    <p>• SMS messages are charged per message sent. Review AWS SNS pricing.</p>
                    <p>• For transactional messages, set the SMS type to "Transactional" in your AWS console.</p>
                  </>
                ) : (
                  <>
                    <p>• Get your Account SID and Auth Token from the Twilio Console dashboard.</p>
                    <p>• You need to purchase a Twilio phone number to send SMS messages.</p>
                    <p>• Trial accounts can only send messages to verified numbers.</p>
                    <p>• Consider using Twilio Messaging Services for better deliverability.</p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
          )}
        </Tabs>

        {/* Store Dialog */}
        <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStore ? "Edit Store" : "Add New Store"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-card-foreground">Store Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Store Name *</Label>
                    <Input
                      value={storeFormData.name}
                      onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                      placeholder="Main Store - Downtown"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={storeFormData.email}
                        onChange={(e) => setStoreFormData({ ...storeFormData, email: e.target.value })}
                        placeholder="store@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={storeFormData.phone}
                        onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={storeFormData.address}
                        onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={storeFormData.city}
                      onChange={(e) => setStoreFormData({ ...storeFormData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={storeFormData.state}
                        onChange={(e) => setStoreFormData({ ...storeFormData, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP Code</Label>
                      <Input
                        value={storeFormData.zip}
                        onChange={(e) => setStoreFormData({ ...storeFormData, zip: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slot Duration</Label>
                  <Select
                    value={storeFormData.slotDuration}
                    onValueChange={(v) => setStoreFormData({ ...storeFormData, slotDuration: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Appointment slot duration for this store</p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium text-card-foreground">Business Hours</h3>
                </div>
                <div className="space-y-2">
                  {storeFormData.hours.map((hour, index) => (
                    <div
                      key={hour.day}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        hour.isOpen ? "bg-accent/30 border-border" : "bg-muted/30 border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={hour.isOpen}
                          onCheckedChange={() => toggleStoreHour(index)}
                        />
                        <span className={`font-medium w-24 text-sm ${hour.isOpen ? "text-card-foreground" : "text-muted-foreground"}`}>
                          {hour.day}
                        </span>
                      </div>
                      {hour.isOpen ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            className="w-28 text-sm"
                            value={hour.openTime}
                            onChange={(e) => updateStoreHour(index, "openTime", e.target.value)}
                          />
                          <span className="text-muted-foreground text-sm">to</span>
                          <Input
                            type="time"
                            className="w-28 text-sm"
                            value={hour.closeTime}
                            onChange={(e) => updateStoreHour(index, "closeTime", e.target.value)}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-card-foreground">Store Active</p>
                  <p className="text-sm text-muted-foreground">Allow bookings for this store</p>
                </div>
                <Switch
                  checked={storeFormData.isActive}
                  onCheckedChange={(v) => setStoreFormData({ ...storeFormData, isActive: v })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsStoreDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveStore}>
                  {editingStore ? "Update Store" : "Add Store"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
