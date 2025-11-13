import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  max_registrations: number;
  current_registrations: number;
  is_completed: boolean;
  venues: { name: string } | null;
  clubs: { name: string } | null;
}

export default function Hub() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*, venues(name), clubs(name)');

    if (filter === 'completed') {
      query = query.eq('is_completed', true);
    } else {
      query = query.eq('is_completed', false);
    }

    query = query.order('start_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load events');
      console.error(error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">The Hub</h1>
            <p className="text-muted-foreground">
              Discover events and manage club activities
            </p>
          </div>
          {userRole === 'club' && (
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/hub/venues">
                  <MapPin className="h-4 w-4 mr-2" />
                  Book Venue
                </Link>
              </Button>
              <Button asChild>
                <Link to="/hub/event/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            </div>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {event.image_url && (
                      <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-primary" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {event.is_completed ? (
                          <Badge className="bg-green-500">Completed</Badge>
                        ) : (
                          <Badge>Upcoming</Badge>
                        )}
                      </div>
                      {event.clubs && (
                        <p className="text-sm text-muted-foreground">
                          by {event.clubs.name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.start_date).toLocaleDateString()}
                        </div>
                        {event.venues && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.venues.name}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {event.current_registrations} / {event.max_registrations} registered
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/hub/event/${event.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                {events.length === 0 && (
                  <Card className="col-span-full p-12 text-center">
                    <p className="text-muted-foreground">No events found</p>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
