import { memo } from "react";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
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
        todayAppointments: data.todayAppointments,
        totalClients: data.totalClients,
        availableSlots: data.availableSlots,
        bookingRate: data.bookingRate,
      };
    },
    enabled: isClientAccess,
    initialData: {
      todayAppointments: 0,
      totalClients: 0,
      availableSlots: 0,
      bookingRate: "0%",
    },
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
                value={stats.todayAppointments}
                change="+2 from yesterday"
                changeType="positive"
                icon={Calendar}
              />
              <StatCard
                title="Total Clients"
                value={stats.totalClients}
                change="+18 this month"
                changeType="positive"
                icon={Users}
              />
              <StatCard
                title="Available Slots"
                value={stats.availableSlots}
                change="Today"
                changeType="neutral"
                icon={Clock}
              />
              <StatCard
                title="Booking Rate"
                value={stats.bookingRate}
                change="+5% from last week"
                changeType="positive"
                icon={TrendingUp}
              />
            </div>

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
