import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, MessageSquare, Calendar, LayoutDashboard, Plus, MapPin, LogOut, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, userRole, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myFeedback, setMyFeedback] = useState<any[]>([]);
  const [myEventFeedback, setMyEventFeedback] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyFeedback();
      fetchMyEventFeedback();
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
      .select('*, feedback_comments(count)')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });
    
    console.log('My feedback:', data);
    setMyFeedback(data || []);
  };

  const fetchMyEventFeedback = async () => {
    const { data } = await supabase
      .from('event_feedback')
      .select('*, events(title)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setMyEventFeedback(data || []);
  };

  const fetchMyEvents = async () => {
    if (userRole === 'club') {
      // For club reps, show events their club has created
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id')
        .eq('profile_id', user?.id)
        .limit(1);

      if (clubsData && clubsData.length > 0) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('club_id', clubsData[0].id)
          .order('start_date', { ascending: false });
        
        // Format to match the registration structure
        const formattedData = (data || []).map(event => ({
          id: event.id,
          events: event
        }));
        setMyEvents(formattedData);
      }
    } else {
      // For students, show events they've registered for
      const { data } = await supabase
        .from('event_registrations')
        .select('*, events(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setMyEvents(data || []);
    }
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

        {/* Club Management Dashboard - Only for Club Reps */}
        {userRole === 'club' && (
          <Card className="mb-6 border-accent bg-gradient-to-r from-accent/5 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Club Management Dashboard
              </CardTitle>
              <CardDescription>
                Manage your club, create events, and book venues
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="flex-1 min-w-[200px]">
                <Link to="/club/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Club Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 min-w-[200px]">
                <Link to="/club/events/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 min-w-[200px]">
                <Link to="/club/venues">
                  <MapPin className="h-4 w-4 mr-2" />
                  Book Venue
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

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
                  <span className="text-muted-foreground">Voice Complaints</span>
                  <span className="font-bold">{myFeedback.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event Feedback</span>
                  <span className="font-bold">{myEventFeedback.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Events Attended</span>
                  <span className="font-bold">{myEvents.length}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={async () => {
                    console.log('[Profile] Logout button clicked');
                    try {
                      await signOut();
                    } catch (error) {
                      console.error('[Profile] Logout error:', error);
                    }
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="voice">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="voice">Voice Complaints</TabsTrigger>
                  <TabsTrigger value="eventFeedback">Event Feedback</TabsTrigger>
                  <TabsTrigger value="events">My Events</TabsTrigger>
                </TabsList>

                <TabsContent value="voice" className="space-y-4 mt-4">
                  {myFeedback.length > 0 ? (
                    myFeedback.map((feedback) => {
                      const commentCount = feedback.feedback_comments?.[0]?.count || 0;
                      return (
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
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <Badge className="text-xs">{feedback.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ThumbsUp className="h-3 w-3" />
                              <span>{feedback.upvotes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span>{commentCount}</span>
                            </div>
                            {feedback.is_resolved && (
                              <Badge className="text-xs bg-green-500">Resolved</Badge>
                            )}
                            {feedback.status && feedback.status !== 'pending' && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {feedback.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No voice complaints submitted yet
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="eventFeedback" className="space-y-4 mt-4">
                  {myEventFeedback.length > 0 ? (
                    myEventFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="block p-4 rounded-lg border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{feedback.events?.title || 'Event'}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {feedback.feedback_text}
                            </p>
                          </div>
                          <MessageSquare className="h-5 w-5 text-muted-foreground ml-4" />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className="text-xs">Rating: {feedback.rating}/5</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                          {feedback.is_anonymous && (
                            <Badge variant="outline" className="text-xs">Anonymous</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No event feedback submitted yet
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
