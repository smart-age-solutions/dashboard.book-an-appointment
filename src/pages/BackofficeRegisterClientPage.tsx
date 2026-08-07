import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function BackofficeRegisterClientPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    password: "",
  });
  
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.ownerName || !formData.email || !formData.password) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      await api.post("/backoffice/clients", {
        company_name: formData.companyName,
        owner_name: formData.ownerName,
        email: formData.email,
        password: formData.password,
      });
      
      toast({
        title: "Success",
        description: "Client account created successfully.",
      });
      
      navigate("/backoffice");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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
          <h1 className="text-2xl font-bold text-foreground">Register New Client</h1>
          <p className="mt-1 text-muted-foreground">
            Create a new tenant workspace and their administrative owner account.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl bg-card p-6 card-shadow border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  required
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner / Contact Name *</Label>
                <Input
                  id="ownerName"
                  required
                  placeholder="Jane Smith"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">The person who will manage this account.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@acme.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Admin Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 flex gap-3">
                <Building2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">What happens next?</p>
                  <p className="mt-1 opacity-90">
                    This will immediately provision a new workspace for the client. The administrative user can log in with the credentials provided above. You can also enter Admin Mode for this client from the Client Management page to set up their workspace on their behalf.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/backoffice")}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Client...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
