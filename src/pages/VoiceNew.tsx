import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export default function VoiceNew() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as 'facilities' | 'academics' | 'events' | 'administration' | 'other';

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be signed in to submit feedback');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('feedback')
      .insert([{
        title,
        content,
        category,
        user_id: user.id  // Save the user ID so they can get notifications
      }]);

    if (error) {
      toast.error('Failed to submit feedback');
      console.error(error);
    } else {
      toast.success('Feedback submitted successfully! Faculty will be notified.');
      navigate('/voice');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Submit New Feedback</CardTitle>
                <CardDescription>
                  Share your thoughts anonymously. Your voice matters.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief summary of your feedback"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" required defaultValue="other">
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="academics">Academics</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="administration">Administration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Your Feedback</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Describe your feedback in detail..."
                  required
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Your feedback will be posted anonymously
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/voice')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
