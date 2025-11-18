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
import { Users } from 'lucide-react';

export default function ClubSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const { error } = await supabase
        .from('clubs')
        .insert({
          profile_id: user?.id,
          name,
          description,
          performance_score: 50
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Club profile already exists');
        } else {
          toast.error('Failed to create club profile');
          console.error(error);
        }
      } else {
        toast.success('Club profile created successfully!');
        navigate('/club/dashboard');
      }
    } catch (error) {
      console.error('Error creating club:', error);
      toast.error('Failed to create club profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Complete Club Profile</CardTitle>
                <CardDescription>
                  Set up your club profile to start creating events
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your club name"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Club Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your club's mission and activities..."
                  required
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/profile')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Club Profile'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
