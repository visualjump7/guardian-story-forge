import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, Star, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    featuredStories: 0,
    publicStories: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [usersResult, storiesResult, completeResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }),
      supabase.from('stories').select('*', { count: 'exact', head: true }).eq('is_complete', true),
    ]);

    setStats({
      totalUsers: usersResult.count || 0,
      totalStories: storiesResult.count || 0,
      featuredStories: 0, // No longer used
      publicStories: completeResult.count || 0, // Repurpose as complete stories
    });
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
    { title: 'Total Stories', value: stats.totalStories, icon: BookOpen, color: 'text-green-600' },
    { title: 'Complete Stories', value: stats.publicStories, icon: Star, color: 'text-yellow-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
