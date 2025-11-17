import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { VenueCard } from '@/components/VenueCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Info, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  image_url: string;
  amenities: string[];
}

export default function PublicVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole, user } = useAuth();

  useEffect(() => {
    console.log('[PublicVenues] Loaded - userRole:', userRole, 'user:', user?.email);
    fetchVenues();
  }, [userRole, user]);

  const fetchVenues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load venues');
      console.error(error);
    } else {
      setVenues(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/hub">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hub
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Campus Venues</h1>
              <p className="text-muted-foreground">
                Explore available venues for events and activities
              </p>
            </div>
            {userRole === 'faculty' && (
              <Button asChild>
                <Link to="/venues/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Venue
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Info Card for Different User Roles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Venue Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userRole === 'student' && (
              <div className="space-y-2">
                <p className="text-sm">
                  🎓 <strong>Students:</strong> Browse venues to see where events are held. 
                  To book a venue, you need to be a club representative.
                </p>
                <p className="text-sm text-muted-foreground">
                  Want to host an event? Join a club or contact existing clubs for collaboration!
                </p>
              </div>
            )}
            {userRole === 'club' && (
              <div className="space-y-2">
                <p className="text-sm">
                  🏛️ <strong>Club Representatives:</strong> Click on any venue to view details and book it for your events.
                </p>
                <p className="text-sm text-muted-foreground">
                  Booking requests are subject to approval by the administration.
                </p>
              </div>
            )}
            {userRole === 'faculty' && (
              <div className="space-y-2">
                <p className="text-sm">
                  👨‍🏫 <strong>Faculty/Admin:</strong> Manage venue bookings and approve requests from clubs.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => {
              const linkToValue = userRole === 'club' ? `/venues/${venue.id}` : undefined;
              console.log(`[PublicVenues] Rendering venue ${venue.id}: userRole=${userRole}, linkTo=${linkToValue}, canEdit=${userRole === 'faculty'}`);
              return (
                <VenueCard 
                  key={venue.id} 
                  venue={venue}
                  canEdit={userRole === 'faculty'}
                  linkTo={linkToValue}
                />
              );
            })}

            {venues.length === 0 && (
              <div className="col-span-full text-center py-12">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No venues available</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}