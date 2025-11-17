import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Upload, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Venue {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  venue_id: string | null;
  start_date: string;
  max_registrations: number;
  club_id: string;
}

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isNotOwner, setIsNotOwner] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteExistingImage, setDeleteExistingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue_id: 'no-venue',
    start_date: '',
    start_time: '',
    max_registrations: 100,
  });

  useEffect(() => {
    if (id && user) {
      fetchEvent();
      fetchVenues();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, clubs(profile_id)')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Failed to load event');
        navigate('/hub');
        return;
      }

      // Check if user is the event owner (club owner)
      if (data.clubs.profile_id !== user?.id) {
        setIsNotOwner(true);
        toast.error('You can only edit events you created');
        navigate('/hub');
        return;
      }

      setEvent(data);

      // Parse datetime
      const eventDate = new Date(data.start_date);
      const dateString = eventDate.toISOString().split('T')[0];
      const timeString = eventDate.toTimeString().slice(0, 5);

      setFormData({
        title: data.title,
        description: data.description,
        venue_id: data.venue_id || 'no-venue',
        start_date: dateString,
        start_time: timeString,
        max_registrations: data.max_registrations,
      });

      // Set image preview from existing image
      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      navigate('/hub');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Venues error:', error);
      } else {
        setVenues(data || []);
      }
    } catch (err) {
      console.error('Venues fetch error:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
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
    setDeleteExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadEventImage = async (): Promise<string | null> => {
    if (!imageFile || !event) return null;

    try {
      setIsUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${event.club_id}/${Date.now()}.${fileExt}`;

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

      // Get the public URL
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

  const deleteOldImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const clubId = urlParts[urlParts.length - 2];

      await supabase.storage
        .from('event-images')
        .remove([`${clubId}/${fileName}`]);
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Don't fail the update if image deletion fails
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_registrations' ? parseInt(value) : value,
    }));
  };

  const handleVenueChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      venue_id: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;

    setIsLoading(true);

    try {
      let imageUrl = event.image_url;

      // Handle image deletion if user removed the image
      if (deleteExistingImage) {
        console.log('User removed image, setting to null');
        imageUrl = null;
        // Delete old image from storage if it exists
        if (event.image_url) {
          console.log('Deleting image from storage:', event.image_url);
          await deleteOldImage(event.image_url);
        }
      }

      // Upload new image if selected
      if (imageFile) {
        console.log('New image file detected, uploading...');
        const newImageUrl = await uploadEventImage();
        console.log('Upload result:', newImageUrl);
        
        if (newImageUrl) {
          imageUrl = newImageUrl;
          console.log('Using new image URL:', imageUrl);
          // Delete old image if it exists (when replacing)
          if (event.image_url && !deleteExistingImage) {
            console.log('Deleting old image:', event.image_url);
            await deleteOldImage(event.image_url);
          }
        } else {
          console.warn('Image upload failed, proceeding without image');
          imageUrl = deleteExistingImage ? null : event.image_url; // Keep old image if upload failed and we didn't mark for deletion
          toast.error('Image upload failed, but you can update event without image');
        }
      } else if (!deleteExistingImage) {
        console.log('No new image file, keeping existing URL:', imageUrl);
      }

      const startDateTime = new Date(
        `${formData.start_date}T${formData.start_time}`
      );

      console.log('Updating event with:', {
        title: formData.title,
        description: formData.description,
        image_url: imageUrl,
        start_date: startDateTime.toISOString(),
      });

      const { error, data } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          image_url: imageUrl,
          venue_id: formData.venue_id === 'no-venue' ? null : formData.venue_id,
          start_date: startDateTime.toISOString(),
          max_registrations: formData.max_registrations,
        })
        .eq('id', event.id)
        .select();

      console.log('Update response:', { error, data });

      if (error) {
        console.error('Database update error:', error);
        toast.error('Failed to update event');
      } else {
        console.log('Event updated successfully:', data);
        toast.success('Event updated successfully!');
        navigate(`/hub/event/${event.id}`);
      }
    } catch (error) {
      console.error('Event update error:', error);
      toast.error('An error occurred while updating the event');
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (isNotOwner || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">You don't have permission to edit this event.</p>
              <Button onClick={() => navigate('/hub')} className="mt-4">
                Back to Events
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
        <div className="mb-6 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/hub/event/${event.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Event</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Update Event Details</CardTitle>
                <CardDescription>
                  Modify your event information and image
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
                  value={formData.title}
                  onChange={handleInputChange}
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
                  value={formData.description}
                  onChange={handleInputChange}
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
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_id">Venue (Optional)</Label>
                <Select value={formData.venue_id} onValueChange={handleVenueChange}>
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
                  value={formData.max_registrations}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="1000"
                />
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

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Changes to title, description, date, time, and image are editable. 
                  Maximum registrations can be increased but not decreased below current registration count.
                </p>
              </div>
            </CardContent>

            <div className="flex gap-4 p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/hub/event/${event.id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || isUploadingImage}
              >
                {isLoading ? 'Updating...' : isUploadingImage ? 'Uploading image...' : 'Update Event'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
