import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X } from 'lucide-react';

export default function VenueNew() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');

  // Check if user is faculty
  if (userRole !== 'faculty') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-muted-foreground mt-2">Only faculty members can add venues</p>
          </div>
        </main>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `venue-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { error: uploadError, data } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      setImageUrl(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
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
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const capacity = parseInt(formData.get('capacity') as string, 10);

    if (!name || !description || !capacity) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (capacity < 1) {
      toast.error('Capacity must be at least 1');
      setLoading(false);
      return;
    }

    try {
      console.log('[VenueNew] Creating venue:', { name, description, capacity, amenities, imageUrl });

      const { data, error } = await supabase
        .from('venues')
        .insert({
          name,
          description,
          capacity,
          amenities: amenities.length > 0 ? amenities : null,
          image_url: imageUrl
        })
        .select();

      if (error) {
        console.error('[VenueNew] Insert error:', error);
        toast.error(`Failed to create venue: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('[VenueNew] Venue created successfully:', data);
      toast.success('Venue created successfully!');
      navigate('/venues');
    } catch (error) {
      console.error('[VenueNew] Error:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

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
            <CardTitle>Add New Venue</CardTitle>
            <CardDescription>
              Create a new venue for clubs to book for their events
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

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating venue...' : 'Create Venue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
