import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  image_url: string | null;
  amenities: string[] | null;
  created_at: string;
}

export default function VenueEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVenue();
    }
  }, [id]);

  const fetchVenue = async () => {
    if (!id) return;

    setLoading(true);
    try {
      console.log('[VenueEdit] Fetching venue:', id);

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[VenueEdit] Fetch error:', error);
        toast.error('Failed to load venue');
        navigate('/venues');
        return;
      }

      console.log('[VenueEdit] Venue loaded:', data);
      setVenue(data);
      setImageUrl(data.image_url);
      setAmenities(data.amenities || []);
    } catch (error) {
      console.error('[VenueEdit] Error:', error);
      toast.error('An error occurred');
      navigate('/venues');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      console.log('[VenueEdit] Uploading new image');

      // Delete old image if exists
      if (venue?.image_url) {
        try {
          const oldFileName = venue.image_url.split('/').pop();
          if (oldFileName) {
            console.log('[VenueEdit] Deleting old image:', oldFileName);
            await supabase.storage
              .from('event-images')
              .remove([oldFileName]);
          }
        } catch (error) {
          console.error('[VenueEdit] Error deleting old image:', error);
          // Continue anyway
        }
      }

      const fileName = `venue-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[VenueEdit] Upload error:', uploadError);
        toast.error('Failed to upload image');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      console.log('[VenueEdit] Image uploaded:', urlData.publicUrl);
      setImageUrl(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('[VenueEdit] Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!venue) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const capacity = parseInt(formData.get('capacity') as string, 10);

      if (!name || !description || !capacity) {
        toast.error('Please fill in all required fields');
        setIsSaving(false);
        return;
      }

      if (capacity < 1) {
        toast.error('Capacity must be at least 1');
        setIsSaving(false);
        return;
      }

      console.log('[VenueEdit] Updating venue:', { name, description, capacity, amenities, imageUrl });

      const { error } = await supabase
        .from('venues')
        .update({
          name,
          description,
          capacity,
          amenities: amenities.length > 0 ? amenities : null,
          image_url: imageUrl
        })
        .eq('id', venue.id);

      if (error) {
        console.error('[VenueEdit] Update error:', error);
        toast.error(`Failed to update venue: ${error.message}`);
        setIsSaving(false);
        return;
      }

      console.log('[VenueEdit] Venue updated successfully');
      toast.success('Venue updated successfully!');
      navigate('/venues');
    } catch (error) {
      console.error('[VenueEdit] Error:', error);
      toast.error('An unexpected error occurred');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!venue) return;

    setDeleting(true);
    try {
      console.log('[VenueEdit] Deleting venue:', venue.id);

      // Delete image from storage if exists
      if (venue.image_url) {
        try {
          const fileName = venue.image_url.split('/').pop();
          if (fileName) {
            console.log('[VenueEdit] Deleting venue image:', fileName);
            await supabase.storage
              .from('event-images')
              .remove([fileName]);
          }
        } catch (error) {
          console.error('[VenueEdit] Error deleting image:', error);
          // Continue anyway
        }
      }

      // Delete venue
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venue.id);

      if (error) {
        console.error('[VenueEdit] Delete error:', error);
        toast.error(`Failed to delete venue: ${error.message}`);
        setDeleting(false);
        return;
      }

      console.log('[VenueEdit] Venue deleted successfully');
      toast.success('Venue deleted successfully!');
      navigate('/venues');
    } catch (error) {
      console.error('[VenueEdit] Error:', error);
      toast.error('An unexpected error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </main>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Venue Not Found</h1>
            <p className="text-muted-foreground mt-2">This venue doesn't exist</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/venues')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Venues
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Venue</CardTitle>
            <CardDescription>
              Update venue details, image, and amenities
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Venue Image</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    {imageUrl ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                        <img src={imageUrl} alt="Venue" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl(null)}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={venue.name}
                  placeholder="e.g., Main Auditorium"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={venue.description}
                  placeholder="Describe the venue, features, and suitable for what types of events..."
                  rows={4}
                  required
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (people) *</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  defaultValue={venue.capacity}
                  placeholder="e.g., 100"
                  min="1"
                  required
                />
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label htmlFor="amenity">Amenities</Label>
                <div className="flex gap-2">
                  <Input
                    id="amenity"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    placeholder="e.g., WiFi, Projector, Sound System"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAmenity();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addAmenity}
                    variant="outline"
                    disabled={!amenityInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(amenity)}
                          className="ml-1 hover:opacity-80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>

                {!deleteConfirm && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to delete this venue? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete Venue'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
