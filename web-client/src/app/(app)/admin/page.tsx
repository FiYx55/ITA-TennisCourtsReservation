"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "@/modules/admin/components/admin-dashboard";
import { UserManagement } from "@/modules/admin/components/user-management";
import { CourtManagement } from "@/modules/admin/components/court-management";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isAdmin(user)) {
      router.replace("/courts");
    }
  }, [user, router]);

  if (!user || !isAdmin(user)) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courts">Courts</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <AdminDashboard />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UserManagement />
        </TabsContent>
        <TabsContent value="courts" className="mt-4">
          <CourtManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
