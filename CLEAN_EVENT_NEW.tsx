import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { CreateClubProfile } from '@/components/CreateClubProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
}

export default function EventNew() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [club, setClub] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setPageLoading(true);
      fetchClubAndVenues().finally(() => setPageLoading(false));
    }
  }, [user]);

  const fetchClubAndVenues = async () => {
    try {
      console.log('Fetching club and venues for user:', user?.id);
      
      // Fetch user's club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (clubError) {
        console.error('Club fetch error:', clubError);
        toast.error('Failed to load club data');
        navigate('/');
        return;
      }

      if (!clubData) {
        console.log('No club found for user, will show create form');
        setClub(null);
      } else {
        console.log('Club found:', clubData);
        setClub(clubData);
      }

      // Fetch venues
      try {
        const { data: venuesData, error: venuesError } = await supabase
          .from('venues')
          .select('id, name')
          .order('name');

        if (venuesError) {
          console.error('Venues error:', venuesError);
        } else {
          setVenues(venuesData || []);
        }
      } catch (err) {
        console.error('Venues fetch error:', err);
        setVenues([]);
      }
      
    } catch (error) {
      console.error('General fetch error:', error);
      toast.error('Failed to load data. Please try again.');
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!club) return;

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const venueId = formData.get('venue_id') as string;
    const startDate = formData.get('start_date') as string;
    const startTime = formData.get('start_time') as string;
    const maxRegistrations = parseInt(formData.get('max_registrations') as string);

    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}`);

    const { error } = await supabase
      .from('events')
      .insert([{
        club_id: club.id,
        title,
        description,
        venue_id: venueId === 'none' ? null : venueId,
        start_date: startDateTime.toISOString(),
        max_registrations: maxRegistrations,
        current_registrations: 0,
        is_completed: false
      }]);

    if (error) {
      toast.error('Failed to create event');
      console.error(error);
    } else {
      toast.success('Event created successfully!');
      navigate('/club/dashboard');
    }

    setIsLoading(false);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <p className="text-muted-foreground">Loading club information...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <>
        <Navbar />
        <CreateClubProfile onClubCreated={(newClub) => setClub(newClub)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create New Event</CardTitle>
                <CardDescription>
                  Create an engaging event for your club members
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter event title"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your event..."
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Event Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_id">Venue (Optional)</Label>
                <Select name="venue_id">
                  <SelectTrigger id="venue_id">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="none">No venue selected</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_registrations">Maximum Registrations</Label>
                <Input
                  id="max_registrations"
                  name="max_registrations"
                  type="number"
                  placeholder="100"
                  required
                  min="1"
                  max="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Event Image (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Image upload coming soon
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Post-Event Features (Coming Soon)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom feedback questions for attendees</li>
                  <li>• Photo gallery for event highlights</li>
                  <li>• Winner announcements and podium photos</li>
                </ul>
              </div>
            </CardContent>

            <div className="flex gap-4 p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/club/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}