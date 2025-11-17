import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  image_url: string;
  amenities: string[];
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function VenueDetail() {
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (id) {
      console.log('[VenueDetail] Loading venue ID:', id);
      fetchVenue();
      fetchBookings();
    }
  }, [id]);

  const fetchVenue = async () => {
    console.log('[VenueDetail] Fetching venue:', id);
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[VenueDetail] Fetch error:', error);
      toast.error('Failed to load venue');
    } else {
      console.log('[VenueDetail] Venue loaded:', data);
      setVenue(data);
    }
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('venue_bookings')
      .select('*')
      .eq('venue_id', id)
      .eq('status', 'confirmed');

    if (error) {
      console.error(error);
    } else {
      setBookings(data || []);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !startTime || !endTime || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that end time is after start time
    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);
    const startTotalMins = startHours * 60 + startMins;
    const endTotalMins = endHours * 60 + endMins;

    if (endTotalMins <= startTotalMins) {
      toast.error('End time must be after start time');
      return;
    }

    console.log('Booking attempt by user:', {
      userId: user.id,
      email: user.email,
      userRole: userRole,
      date: selectedDate,
      startTime,
      endTime
    });

    setBooking(true);

    // Get user's club or create one if it doesn't exist
    let { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!club) {
      console.log('No club found, creating one for user:', user.id);
      // Auto-create club for the user
      const { data: newClub, error: createError } = await supabase
        .from('clubs')
        .insert({
          profile_id: user.id,
          name: `${user.email?.split('@')[0] || 'User'}'s Club`,
          description: 'Club profile created for venue booking',
          performance_score: 50
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Failed to create club:', createError);
        toast.error('Failed to create club profile. Please contact admin.');
        setBooking(false);
        return;
      }
      
      club = newClub;
      toast.success('Club profile created! Proceeding with booking...');
    }

    const bookingStartTime = new Date(selectedDate);
    bookingStartTime.setHours(startHours, startMins);

    const bookingEndTime = new Date(selectedDate);
    bookingEndTime.setHours(endHours, endMins);

    const { error } = await supabase
      .from('venue_bookings')
      .insert({
        venue_id: id,
        club_id: club.id,
        start_time: bookingStartTime.toISOString(),
        end_time: bookingEndTime.toISOString(),
        status: 'pending'
      });

    if (error) {
      toast.error('Failed to book venue');
      console.error(error);
    } else {
      toast.success('Booking request submitted! You will be notified once approved.');
      fetchBookings();
      setStartTime('');
      setEndTime('');
    }

    setBooking(false);
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

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

  if (!venue) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Venue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/venues">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Venue Info */}
          <div className="space-y-6">
            <Card>
              <div className="h-64 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center rounded-t-lg">
                <MapPin className="h-24 w-24 text-primary" />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{venue.name}</CardTitle>
                <CardDescription>
                  {venue.description || 'Professional venue space'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span>Capacity: {venue.capacity} people</span>
                </div>
                
                {venue.amenities && venue.amenities.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Available Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book This Venue</CardTitle>
                <CardDescription>
                  Select your preferred date and time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="font-medium mb-3">Select Date:</p>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <p className="font-medium mb-3">Select Start Time:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={startTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStartTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-3">Select End Time:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={endTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEndTime(time)}
                        disabled={startTime && time <= startTime}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedDate && startTime && endTime && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Booking Summary:</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString()} from {startTime} to {endTime}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleBooking}
                  disabled={!selectedDate || !startTime || !endTime || booking}
                  className="w-full"
                >
                  {booking ? 'Submitting...' : 'Submit Booking Request'}
                </Button>

                <div className="text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Booking requests are subject to approval
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}