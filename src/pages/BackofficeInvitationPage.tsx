import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft, Loader2, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Client {
  id: string;
  companyName: string;
}

export default function BackofficeInvitationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!formData.email.toLowerCase().endsWith("@smartagesolutions.com")) {
      toast({ 
        title: "Invalid Email", 
        description: "Only @smartagesolutions.com emails are allowed for backoffice users.", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/backoffice/invite", {
        name: formData.name,
        email: formData.email,
      });
      
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${formData.email}`,
      });
      
      navigate("/backoffice");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/backoffice")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invite Backoffice User</h1>
          <p className="mt-1 text-muted-foreground">
            Invite a new administrator to the Smart Age Solutions backoffice.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl bg-card p-6 card-shadow border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (@smartagesolutions.com) *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@smartagesolutions.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Important</p>
                <p className="mt-1 opacity-90">
                  Backoffice users have full control over all clients and system settings. 
                  Ensure the email address is correct and belongs to a trusted administrator.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/backoffice")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Admin
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex gap-3">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Invitation Process</p>
            <p className="mt-1 opacity-90">
              The user will receive an email with a unique link to set their password. 
              The invitation remains active until they create their account.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
