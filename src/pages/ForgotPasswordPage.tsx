import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      await api.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast({ 
        title: "Link Sent", 
        description: "If an account exists with that email, a reset link has been sent." 
      });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Something went wrong", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4">
            <Calendar className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SmartAppointment</h1>
          <p className="text-muted-foreground mt-1">Recovery System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card p-8 card-shadow border border-border">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-card-foreground">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base pl-12"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                We've sent a password reset link to <strong>{email}</strong> if it's registered in our system.
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsSubmitted(false)}
              >
                Resend email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate("/login")} 
              className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center mx-auto transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Smart Age Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
}
