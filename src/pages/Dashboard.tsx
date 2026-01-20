import { useState, useEffect } from "react";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalClients: 0,
    availableSlots: 0,
    bookingRate: "0%",
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isBackofficeUser } = useAuth();
  const { isImpersonating } = useImpersonation();

  useEffect(() => {
    const fetchStats = async () => {
      // Don't fetch client stats if backoffice user is not impersonating
      if (isBackofficeUser && !isImpersonating) {
        setIsLoading(false);
        return;
      }
      
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const [aptData, userData] = await Promise.all([
          api.get("/appointments", { start_date: today, end_date: today }),
          api.get("/teams/all-members")
        ]);

        setStats({
          todayAppointments: aptData.pagination.total_items,
          totalClients: userData.pagination.total_items,
          availableSlots: 0, // Need backend support for availability calculation
          bookingRate: "0%", // Need backend support for stats calculation
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isBackofficeUser, isImpersonating]);

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
          {(!isBackofficeUser || isImpersonating) && (
            <>
              <UpcomingAppointments />
              <RecentActivity />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
