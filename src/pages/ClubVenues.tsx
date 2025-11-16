import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { VenueCard } from '@/components/VenueCard';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  image_url: string;
  amenities: string[];
}

export default function ClubVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, []);

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
            <Link to="/club/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">Venue Booking</h1>
          <p className="text-muted-foreground">
            Browse and book venues for your club events
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}

            {venues.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No venues available for booking</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}