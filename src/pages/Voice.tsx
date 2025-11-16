import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { FeedbackCard } from '@/components/FeedbackCard';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Feedback {
  id: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  is_resolved: boolean;
  created_at: string;
  feedback_comments: { count: number }[];
}

export default function Voice() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    let query = supabase
      .from('feedback')
      .select('*, feedback_comments(count)');

    if (filter === 'popular') {
      query = query.order('upvotes', { ascending: false });
    } else if (filter === 'resolved') {
      query = query.eq('is_resolved', true);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load feedback');
      console.error(error);
    } else {
      setFeedbacks(data || []);
    }
    setLoading(false);
  };

  const handleUpvote = async (feedbackId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingUpvote } = await supabase
      .from('feedback_upvotes')
      .select()
      .eq('feedback_id', feedbackId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingUpvote) {
      await supabase.from('feedback_upvotes').delete().eq('id', existingUpvote.id);
      toast.success('Upvote removed');
    } else {
      const { error } = await supabase
        .from('feedback_upvotes')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id
        });
      
      if (!error) {
        toast.success('Upvoted!');
      }
    }

    fetchFeedbacks();
  };



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">The Voice</h1>
            <p className="text-muted-foreground">
              Share your feedback anonymously and make your voice heard
            </p>
          </div>
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link to="/voice/new">
                <Plus className="h-4 w-4 mr-2" />
                New Feedback
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4">
            {feedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onUpvote={handleUpvote}
              />
            ))}

            {feedbacks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No feedback found. Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
