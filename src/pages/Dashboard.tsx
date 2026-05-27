import { memo } from "react";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";

const Dashboard = memo(function Dashboard() {
  const { isBackofficeUser } = useAuth();
  const { isImpersonating } = useImpersonation();

  const isClientAccess = !isBackofficeUser || isImpersonating;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", isImpersonating],
    queryFn: async () => {
      const data = await api.get("/auth/stats/dashboard");
      return {
        todayAppointments: data.todayAppointments ?? 0,
        apptChange: data.apptChange ?? "",
        totalClients: data.totalClients ?? 0,
        clientsChange: data.clientsChange ?? "",
        availableSlots: data.availableSlots ?? 0,
        bookingRate: data.bookingRate ?? "0%",
        rateChange: data.rateChange ?? "",
      };
    },
    enabled: isClientAccess,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading && isClientAccess) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingSpinner size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here's what's happening with your appointments.
          </p>
        </div>

        {!isClientAccess ? (
          <div className="flex h-[40vh] items-center justify-center rounded-xl border-2 border-dashed border-muted p-12 text-center text-muted-foreground">
            Please impersonate a client to view dashboard statistics.
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Today's Appointments"
                value={stats?.todayAppointments ?? 0}
                change={stats?.apptChange ?? ""}
                changeType={(stats?.apptChange ?? "").startsWith("+") ? "positive" : (stats?.apptChange ?? "").startsWith("-") ? "negative" : "neutral"}
                icon={Calendar}
              />
              <StatCard
                title="Total Clients"
                value={stats?.totalClients ?? 0}
                change={stats?.clientsChange ?? ""}
                changeType={(stats?.clientsChange ?? "").startsWith("+") ? "positive" : "neutral"}
                icon={Users}
              />
              <StatCard
                title="Available Slots"
                value={stats?.availableSlots ?? 0}
                change="Today"
                changeType="neutral"
                icon={Clock}
              />
              <StatCard
                title="Booking Rate"
                value={stats?.bookingRate ?? "0%"}
                change={stats?.rateChange ?? ""}
                changeType={(stats?.rateChange ?? "").startsWith("+") ? "positive" : (stats?.rateChange ?? "").startsWith("-") ? "negative" : "neutral"}
                icon={TrendingUp}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              <UpcomingAppointments />
              <RecentActivity />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
});

export default Dashboard;
