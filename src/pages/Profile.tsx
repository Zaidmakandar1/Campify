import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myFeedback, setMyFeedback] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyFeedback();
      fetchMyEvents();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    setProfile(data);
  };

  const fetchMyFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });
    
    setMyFeedback(data || []);
  };

  const fetchMyEvents = async () => {
    const { data } = await supabase
      .from('event_registrations')
      .select('*, events(*)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setMyEvents(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and view your activity
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-primary flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge className="mt-2 capitalize">
                  {userRole === 'club' ? 'Club Representative' : 
                   userRole === 'faculty' ? 'Faculty/Admin' : 
                   'Student'}
                </Badge>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Feedback Submitted</span>
                  <span className="font-bold">{myFeedback.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Events Attended</span>
                  <span className="font-bold">{myEvents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="feedback">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="feedback">My Feedback</TabsTrigger>
                  <TabsTrigger value="events">My Events</TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="space-y-4 mt-4">
                  {myFeedback.length > 0 ? (
                    myFeedback.map((feedback) => (
                      <Link
                        key={feedback.id}
                        to={`/voice/${feedback.id}`}
                        className="block p-4 rounded-lg border hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{feedback.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {feedback.content}
                            </p>
                          </div>
                          <MessageSquare className="h-5 w-5 text-muted-foreground ml-4" />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className="text-xs">{feedback.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                          {feedback.is_resolved && (
                            <Badge className="text-xs bg-green-500">Resolved</Badge>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No feedback submitted yet
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="space-y-4 mt-4">
                  {myEvents.length > 0 ? (
                    myEvents.map((registration) => (
                      <Link
                        key={registration.id}
                        to={`/hub/event/${registration.events.id}`}
                        className="block p-4 rounded-lg border hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{registration.events.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {registration.events.description}
                            </p>
                          </div>
                          <Calendar className="h-5 w-5 text-muted-foreground ml-4" />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(registration.events.start_date).toLocaleDateString()}
                          </span>
                          {registration.events.is_completed ? (
                            <Badge className="text-xs bg-green-500">Completed</Badge>
                          ) : (
                            <Badge className="text-xs">Upcoming</Badge>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No events registered yet
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
