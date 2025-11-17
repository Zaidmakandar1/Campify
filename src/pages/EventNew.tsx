import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { CampifyLogo } from '@/components/CampifyLogo';

interface Venue {
  id: string;
  name: string;
}

export default function EventNew() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]); // Store all booked venues
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [club, setClub] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('no-venue');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setPageLoading(true);
      fetchClubAndVenues().finally(() => setPageLoading(false));
    }
  }, [user]);

  // Filter venues based on selected date and time
  useEffect(() => {
    if (club && startDate && startTime && endTime) {
      filterVenuesByDateTime();
    } else {
      setVenues(allVenues); // Show all booked venues if date/time not selected
    }
  }, [startDate, startTime, endTime, allVenues, club]);

  const fetchClubAndVenues = async () => {
    try {
      console.log('Fetching club and venues for user:', user?.id);
      
      // Fetch user's club (take the first one if multiple exist)
      const { data: clubsData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('profile_id', user?.id)
        .limit(1);

      let clubData = null;
      if (clubsData && clubsData.length > 0) {
        clubData = clubsData[0];
      }

      if (clubError) {
        console.error('Club fetch error:', clubError);
        console.log('No club found, will show create club form');
        setClub(null);
      } else if (!clubData) {
        console.log('No club found for user, will show create form');
        setClub(null);
      } else {
        console.log('Club found:', clubData);
        setClub(clubData);
      }

      // Fetch venues that the club has booked
      if (clubData) {
        try {
          console.log('Fetching venue bookings for club:', clubData.id);
          
          // First, get all bookings for this club
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('venue_bookings')
            .select('venue_id, status')
            .eq('club_id', clubData.id);

          console.log('All bookings for club:', bookingsData);

          if (bookingsError) {
            console.error('Bookings error:', bookingsError);
            toast.error('Failed to load booked venues');
            setVenues([]);
            return;
          }

          if (!bookingsData || bookingsData.length === 0) {
            console.log('No venue bookings found for this club');
            toast.info('No venue bookings found. Please book a venue first.');
            setVenues([]);
            return;
          }

          // Get unique venue IDs from confirmed bookings
          const confirmedVenueIds = [...new Set(
            bookingsData
              .filter(b => b.status === 'confirmed')
              .map(b => b.venue_id)
          )];

          console.log('Confirmed venue IDs:', confirmedVenueIds);

          if (confirmedVenueIds.length === 0) {
            console.log('No confirmed bookings found');
            toast.info('No confirmed venue bookings. Please wait for approval or book a venue.');
            setVenues([]);
            return;
          }

          // Fetch venue details
          const { data: venuesData, error: venuesError } = await supabase
            .from('venues')
            .select('id, name')
            .in('id', confirmedVenueIds)
            .order('name');

          console.log('Venues data:', venuesData);

          if (venuesError) {
            console.error('Venues error:', venuesError);
            toast.error('Failed to load venue details');
            setAllVenues([]);
            setVenues([]);
          } else {
            console.log('Booked venues loaded:', venuesData?.length);
            setAllVenues(venuesData || []);
            setVenues(venuesData || []);
          }
        } catch (err) {
          console.error('Venues fetch error:', err);
          toast.error('Error loading venues');
          setVenues([]);
        }
      }
      
    } catch (error) {
      console.error('General fetch error:', error);
      toast.error('Failed to load data. Please try again.');
    }
  };

  const filterVenuesByDateTime = async () => {
    if (!club || !startDate || !startTime || !endTime) {
      console.log('Cannot filter venues - missing data:', { club: !!club, startDate, startTime, endTime });
      return;
    }

    try {
      const eventStart = new Date(`${startDate}T${startTime}`);
      const eventEnd = new Date(`${startDate}T${endTime}`);

      console.log('=== FILTERING VENUES ===');
      console.log('Club ID:', club.id);
      console.log('Event time:', eventStart.toISOString(), 'to', eventEnd.toISOString());
      console.log('All booked venues:', allVenues);

      // Get bookings for this club that overlap with the selected time
      const { data: bookings, error } = await supabase
        .from('venue_bookings')
        .select('venue_id, venues(id, name)')
        .eq('club_id', club.id)
        .eq('status', 'confirmed')
        .lte('start_time', eventEnd.toISOString())
        .gte('end_time', eventStart.toISOString());

      console.log('Bookings query result:', { bookings, error });

      if (error) {
        console.error('Error filtering venues:', error);
        setVenues(allVenues); // Fallback to all venues
        return;
      }

      if (!bookings || bookings.length === 0) {
        console.log('❌ No venues booked for this time slot');
        setVenues([]);
        setVenueId('no-venue');
        toast.info('No venues booked for this time slot');
        return;
      }

      // Extract unique venues
      const availableVenues = bookings
        .map(b => b.venues)
        .filter((venue, index, self) => 
          venue && self.findIndex(v => v?.id === venue.id) === index
        ) as Venue[];

      console.log('✅ Venues available for selected time:', availableVenues);
      setVenues(availableVenues);

      // Reset venue selection if current selection is not available
      if (venueId !== 'no-venue' && !availableVenues.find(v => v.id === venueId)) {
        setVenueId('no-venue');
      }
    } catch (error) {
      console.error('Error filtering venues:', error);
      setVenues(allVenues);
    }
  };

  const checkVenueAvailability = async (venueIdToCheck: string, dateStr: string, startTimeStr: string, endTimeStr: string): Promise<boolean> => {
    if (venueIdToCheck === 'no-venue' || !club) return true; // No venue selected or no club

    try {
      const eventStart = new Date(`${dateStr}T${startTimeStr}`);
      const eventEnd = new Date(`${dateStr}T${endTimeStr}`);

      // Fetch all confirmed bookings for this venue that overlap with the event time
      // BUT exclude bookings made by the current club (they can use their own bookings)
      const { data: bookings, error } = await supabase
        .from('venue_bookings')
        .select('*')
        .eq('venue_id', venueIdToCheck)
        .eq('status', 'confirmed')
        .neq('club_id', club.id) // Exclude this club's bookings
        .lte('start_time', eventEnd.toISOString())
        .gte('end_time', eventStart.toISOString());

      if (error) {
        console.error('Error checking venue availability:', error);
        return true; // Allow booking if we can't check (safety measure)
      }

      if (bookings && bookings.length > 0) {
        return false; // Venue is booked by another club during this time
      }

      return true; // Venue is available (or booked by your club)
    } catch (error) {
      console.error('Venue availability check error:', error);
      return true; // Allow booking if check fails
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadEventImage = async (): Promise<string | null> => {
    if (!imageFile || !club) return null;

    try {
      setIsUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${club.id}/${Date.now()}.${fileExt}`;
      
      console.log('Starting image upload:', { fileName, fileSize: imageFile.size });

      const { data, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`Failed to upload image: ${uploadError.message}`);
        return null;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!club) return;

    setIsLoading(true);

    try {
      // Validate times
      if (!startDate || !startTime || !endTime) {
        toast.error('Please fill in all date and time fields');
        setIsLoading(false);
        return;
      }

      const [startHours, startMins] = startTime.split(':').map(Number);
      const [endHours, endMins] = endTime.split(':').map(Number);
      const startTotalMins = startHours * 60 + startMins;
      const endTotalMins = endHours * 60 + endMins;

      if (endTotalMins <= startTotalMins) {
        toast.error('End time must be after start time');
        setIsLoading(false);
        return;
      }

      // Check venue availability if a venue is selected
      if (venueId !== 'no-venue') {
        const isAvailable = await checkVenueAvailability(venueId, startDate, startTime, endTime);
        if (!isAvailable) {
          toast.error('This venue is already booked for the selected date and time');
          setIsLoading(false);
          return;
        }
      }

      // Upload image first if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadEventImage();
        // If image upload fails, we can still continue or abort
        if (!imageUrl) {
          toast.error('Image upload failed, but you can create event without image');
          // Uncomment below to abort if image is required
          // setIsLoading(false);
          // return;
        }
      }

      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const maxRegistrations = parseInt(formData.get('max_registrations') as string);
      const totalPeople = parseInt(formData.get('total_people') as string);
      const groupSize = parseInt(formData.get('group_size') as string);

      // Combine date and time for start and end
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      const { error } = await supabase
        .from('events')
        .insert([{
          club_id: club.id,
          title,
          description,
          image_url: imageUrl, // Add the image URL
          venue_id: venueId === 'no-venue' ? null : venueId,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          max_registrations: maxRegistrations,
          total_people: totalPeople,
          group_size: groupSize,
          current_registrations: 0,
          is_completed: false
        }]);

      if (error) {
        toast.error('Failed to create event');
        console.error(error);
      } else {
        toast.success('Event created successfully!');
        navigate('/hub');
      }
    } catch (error) {
      console.error('Event creation error:', error);
      toast.error('An error occurred while creating the event');
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-pulse mb-4">
            <CampifyLogo className="h-16 w-16" />
          </div>
          <p className="text-muted-foreground">Loading event creation...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Club Found</h3>
              <p className="text-yellow-800 mb-4">
                You need to create a club before you can create events.
              </p>
              <Button onClick={() => navigate('/club/dashboard')}>
                Go to Club Dashboard
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
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!startTime}
                  min={startTime}
                />
                {endTime && startTime && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.round((new Date(`2000-01-01T${endTime}`).getTime() - new Date(`2000-01-01T${startTime}`).getTime()) / (1000 * 60))} minutes
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_id">Venue (Optional)</Label>
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger id="venue_id">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="no-venue">No venue selected</SelectItem>
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_people">Total People</Label>
                  <Input
                    id="total_people"
                    name="total_people"
                    type="number"
                    placeholder="50"
                    required
                    min="1"
                    max="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group_size">People Per Group</Label>
                  <Input
                    id="group_size"
                    name="group_size"
                    type="number"
                    placeholder="5"
                    required
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Event Image (Optional)</Label>
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative w-full max-w-md">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload image (max 5MB)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: JPG, PNG, GIF, WebP
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
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
                onClick={() => navigate('/hub')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || isUploadingImage}
              >
                {isLoading ? 'Creating...' : isUploadingImage ? 'Uploading image...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}