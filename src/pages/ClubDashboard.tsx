import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, MapPin, Calendar, Users, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  max_registrations: number;
  current_registrations: number;
  is_completed: boolean;
  venues: { name: string } | null;
}

interface Club {
  id: string;
  name: string;
  description: string;
  performance_score: number;
}

export default function ClubDashboard() {
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchClubData();
    }
  }, [user, filter]);

  const fetchClubData = async () => {
    setLoading(true);
    
    // Fetch club info
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('profile_id', user?.id)
      .single();

    if (clubError) {
      toast.error('Failed to load club data');
      console.error(clubError);
    } else {
      setClub(clubData);
      
      // Fetch club events
      let query = supabase
        .from('events')
        .select('*, venues(name)')
        .eq('club_id', clubData.id);

      if (filter === 'completed') {
        query = query.eq('is_completed', true);
      } else {
        query = query.eq('is_completed', false);
      }

      query = query.order('start_date', { ascending: false });

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) {
        toast.error('Failed to load events');
        console.error(eventsError);
      } else {
        setEvents(eventsData || []);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No Club Found</CardTitle>
              <CardDescription>
                You need to create a club profile first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/profile">Go to Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Club Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{club.name}</h1>
              <p className="text-muted-foreground mb-4">
                {club.description || 'Club Dashboard'}
              </p>
              <div className="flex items-center gap-4">
                <Badge className="text-sm">
                  Performance Score: {club.performance_score}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {events.filter(e => !e.is_completed).length} Active Events
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/club/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/club/venues">
                <MapPin className="h-4 w-4 mr-2" />
                Book Venue
              </Link>
            </Button>
          </div>
        </div>

        {/* Events Management */}
        <Card>
          <CardHeader>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>
              Manage your club's events and track registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="mb-6">
                <TabsTrigger value="ongoing">Ongoing Events</TabsTrigger>
                <TabsTrigger value="completed">Completed Events</TabsTrigger>
              </TabsList>

              <TabsContent value={filter}>
                <div className="grid gap-4">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{event.title}</h3>
                              {event.is_completed ? (
                                <Badge className="bg-green-500">Completed</Badge>
                              ) : (
                                <Badge>Upcoming</Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {event.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.start_date).toLocaleDateString()}
                              </div>
                              {event.venues && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.venues.name}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.current_registrations} / {event.max_registrations}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/hub/event/${event.id}`}>
                                View
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {events.length === 0 && (
                    <Card className="p-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        {filter === 'completed' ? 'No completed events yet' : 'No ongoing events'}
                      </p>
                      {filter === 'ongoing' && (
                        <Button asChild>
                          <Link to="/club/events/new">Create Your First Event</Link>
                        </Button>
                      )}
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}