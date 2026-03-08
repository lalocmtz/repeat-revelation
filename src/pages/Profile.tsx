import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOdds } from "@/contexts/OddsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowLeft, Zap, Crown, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const { user, isPremium, signOut } = useAuth();
  const { oddsFormat, setOddsFormat } = useOdds();
  const [subscription, setSubscription] = useState<{
    status: string;
    plan: string;
    started_at: string | null;
    expires_at: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load subscription info
    supabase
      .from("subscriptions")
      .select("status, plan, started_at, expires_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSubscription(data);
      });
  }, [user, navigate]);

  const handleOddsChange = (format: "decimal" | "american") => {
    setOddsFormat(format);
    toast.success(`Formato de momios: ${format === "decimal" ? "Decimal" : "Americano"}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Activa", color: "bg-primary/20 text-primary border-primary/30" },
    inactive: { label: "Inactiva", color: "bg-secondary text-muted-foreground border-border" },
    cancelled: { label: "Cancelada", color: "bg-destructive/20 text-destructive border-destructive/30" },
    past_due: { label: "Pago pendiente", color: "bg-warning/20 text-warning border-warning/30" },
  };

  const subStatus = subscription ? statusLabels[subscription.status] || statusLabels.inactive : statusLabels.inactive;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-12 md:h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">Tiplives</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-lg px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>

        {/* Account info */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground">Suscripción</CardTitle>
              {isPremium && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Crown className="mr-1 h-3 w-3" /> Pro
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant="outline" className={subStatus.color}>
                {subStatus.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {subscription?.plan || "Free"}
              </span>
            </div>
            {subscription?.started_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Desde</span>
                <span className="text-sm text-foreground">
                  {new Date(subscription.started_at).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {!isPremium && (
              <Button variant="hero" className="w-full gap-2 mt-2" asChild>
                <Link to="/pricing">
                  <Zap className="h-4 w-4" />
                  Obtener acceso Pro — $25/mes
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Odds format */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Formato de momios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex rounded-lg border border-border bg-background p-1">
              <button
                onClick={() => handleOddsChange("decimal")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  oddsFormat === "decimal"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Decimal
                <span className="block text-[11px] opacity-70">1.85</span>
              </button>
              <button
                onClick={() => handleOddsChange("american")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  oddsFormat === "american"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Americano
                <span className="block text-[11px] opacity-70">-118</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default Profile;