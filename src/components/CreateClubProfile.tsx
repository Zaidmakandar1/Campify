import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

interface CreateClubProfileProps {
  onClubCreated: (club: any) => void;
}

export function CreateClubProfile({ onClubCreated }: CreateClubProfileProps) {
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a club');
      return;
    }

    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      console.log('Creating club for user:', user.id);
      console.log('Club data:', { name, description });

      // First check if user already has a club
      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (existingClub) {
        toast.error(`You already have a club: ${existingClub.name}`);
        onClubCreated(existingClub);
        return;
      }

      // Create the club
      const { data: newClub, error } = await supabase
        .from('clubs')
        .insert({
          profile_id: user.id,
          name,
          description,
          performance_score: 50
        })
        .select()
        .single();

      if (error) {
        console.error('Club creation error:', error);
        
        if (error.code === '42501') {
          toast.error('Permission denied. Please make sure you have the correct role.');
        } else if (error.code === '23505' || error.code === '409') {
          // Handle duplicate/conflict errors
          toast.error('A club with this name already exists. Please choose a different name.');
        } else {
          toast.error(`Failed to create club: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.log('Club created successfully:', newClub);
        toast.success('Club profile created successfully!');
        onClubCreated(newClub);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }

    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create Club Profile</CardTitle>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your club's mission and activities..."
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What you can do after creating your club:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create and manage events</li>
                  <li>• Book campus venues</li>
                  <li>• Track member registrations</li>
                  <li>• View performance analytics</li>
                </ul>
              </div>
            </CardContent>

            <div className="flex gap-4 p-6 pt-0">
              <Button
                type="submit"
                className="flex-1"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Club Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}