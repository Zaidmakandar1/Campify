import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCard } from '@/components/EventCard';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
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
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      let query = supabase
        .from('events')
        .select('*, venues(name), clubs(name)');

      if (filter === 'completed') {
        query = query.eq('is_completed', true);
      } else {
        query = query.eq('is_completed', false);
      }

      query = query.order('start_date', { ascending: false });

      const { data, error } = await Promise.race([query, timeoutPromise]) as any;

      if (error) {
        console.error('Events fetch error:', error);
        toast.error('Failed to load events. Please check your connection.');
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Events fetch timeout:', err);
      toast.error('Connection timeout. Please check if Supabase is running.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
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
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link to="/venues">
                <MapPin className="h-4 w-4 mr-2" />
                Browse Venues
              </Link>
            </Button>
            
            {userRole === 'club' && (
              <Button asChild>
                <Link to="/club/events/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
            
            {userRole === 'student' && (
              <div className="text-sm text-muted-foreground flex items-center">
                💡 Want to host events? Join a club first!
              </div>
            )}
          </div>
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
                  <EventCard key={event.id} event={event} />
                ))}

                {events.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No events found</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
