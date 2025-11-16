import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { DataSeeder } from '@/components/DataSeeder';
import { AIInsightsDashboard } from '@/components/AIInsightsDashboard';
import { UserDebugInfo } from '@/components/UserDebugInfo';
import { QuickTestUser } from '@/components/QuickTestUser';
import { DebugUserPermissions } from '@/components/DebugUserPermissions';
import { TestDatabasePermissions } from '@/components/TestDatabasePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, TrendingUp, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Empowering Student Voices
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Welcome to Campify
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your integrated platform for anonymous feedback, event management, and club engagement
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <CardTitle>The Voice</CardTitle>
              <CardDescription>
                Share feedback anonymously and upvote important issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/voice">Explore Feedback</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-accent">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <CardTitle>The Hub</CardTitle>
              <CardDescription>
                Discover events, register, and manage club activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/hub">View Events</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <CardTitle>The Market</CardTitle>
              <CardDescription>
                AI-powered club analysis and real-time rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/market">See AI Rankings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Wins Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">🎉 Recent Wins</CardTitle>
            <CardDescription>
              See how student feedback is making real change
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg bg-background border">
              <p className="font-medium">New Water Cooler Installed in Library</p>
              <p className="text-sm text-muted-foreground">Resolved 2 days ago</p>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <p className="font-medium">Extended Lab Hours During Finals</p>
              <p className="text-sm text-muted-foreground">Resolved 1 week ago</p>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <p className="font-medium">New Study Spaces in Student Center</p>
              <p className="text-sm text-muted-foreground">Resolved 2 weeks ago</p>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific shortcuts */}
        {userRole === 'club' && (
          <div className="mt-8">
            <Card className="border-accent">
              <CardHeader>
                <CardTitle>Club Representative Dashboard</CardTitle>
                <CardDescription>Quick actions for club management</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/club/dashboard">Club Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/club/events/new">Create Event</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/club/venues">Book Venue</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {userRole === 'faculty' && (
          <div className="mt-8">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Faculty administration tools</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/voice/admin">Review Feedback</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Insights Dashboard */}
        <div className="mt-12">
          <AIInsightsDashboard />
        </div>

        {/* Debug Info - Only show for development */}
        <UserDebugInfo />
        <TestDatabasePermissions />
        <QuickTestUser />

        {/* Development Tools - Only show for development */}
        {import.meta.env.DEV && (
          <div className="mt-8 flex justify-center">
            <DataSeeder />
          </div>
        )}
      </main>
    </div>
  );
}
