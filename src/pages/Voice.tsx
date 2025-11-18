import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { FeedbackCard } from '@/components/FeedbackCard';
import { supabase } from '@/integrations/supabase/client';
import { aiAnalytics } from '@/lib/aiAnalytics';
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
  status?: string;
  created_at: string;
  feedback_comments: { count: number }[];
  hasUpvoted?: boolean;
}

export default function Voice() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFeedbacks();
    fetchUserUpvotes();
  }, [filter]);

  const fetchUserUpvotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data } = await supabase
        .from('feedback_upvotes')
        .select('feedback_id')
        .eq('user_id', user.id);

      if (data) {
        setUserUpvotes(new Set(data.map(upvote => upvote.feedback_id)));
      }
    } catch (error) {
      console.error('Error fetching user upvotes:', error);
    }
  };

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
      toast.error('Failed to load complaints');
      console.error(error);
    } else {
      const feedbacksWithUpvotes = (data || []).map(fb => ({
        ...fb,
        hasUpvoted: userUpvotes.has(fb.id)
      }));
      setFeedbacks(feedbacksWithUpvotes);
    }
    setLoading(false);
  };

  const handleUpvote = async (feedbackId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to upvote');
      return;
    }

    const hasUpvoted = userUpvotes.has(feedbackId);

    // Optimistic update
    const newUpvotes = new Set(userUpvotes);
    if (hasUpvoted) {
      newUpvotes.delete(feedbackId);
    } else {
      newUpvotes.add(feedbackId);
    }
    setUserUpvotes(newUpvotes);

    // Update UI immediately
    setFeedbacks(prev => prev.map(fb => 
      fb.id === feedbackId 
        ? { 
            ...fb, 
            upvotes: hasUpvoted ? fb.upvotes - 1 : fb.upvotes + 1,
            hasUpvoted: !hasUpvoted
          }
        : fb
    ));

    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase
          .from('feedback_upvotes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);
        
        // Decrease upvote count
        await supabase.rpc('decrement_upvotes', { feedback_id: feedbackId });
        
        toast.success('Upvote removed');
      } else {
        // Add upvote
        const { error } = await supabase
          .from('feedback_upvotes')
          .insert({
            feedback_id: feedbackId,
            user_id: user.id
          });
        
        if (error) throw error;

        // Increase upvote count
        await supabase.rpc('increment_upvotes', { feedback_id: feedbackId });
        toast.success('Upvoted!');
      }

      // Track activity
      await aiAnalytics.trackActivity({
        user_id: user.id,
        activity_type: hasUpvoted ? 'upvote_remove' : 'upvote_add',
        target_type: 'feedback',
        target_id: feedbackId
      });
    } catch (error) {
      console.error('Error handling upvote:', error);
      toast.error('Failed to update upvote');
      
      // Revert optimistic update on error
      setUserUpvotes(userUpvotes);
      setFeedbacks(prev => prev.map(fb => 
        fb.id === feedbackId 
          ? { 
              ...fb, 
              upvotes: hasUpvoted ? fb.upvotes + 1 : fb.upvotes - 1,
              hasUpvoted: hasUpvoted
            }
          : fb
      ));
    }
  };

  const handleStatusChange = async (feedbackId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to update status');
      return;
    }

    try {
      // First, try to update with status column
      const { error } = await supabase
        .from('feedback')
        .update({
          status,
          is_resolved: status === 'resolved',
          resolved_by: status === 'resolved' ? user.id : null,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', feedbackId);

      if (error) {
        console.error('Full error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // Check if it's a permission/RLS error
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('Permission denied. Please run FIX_FEEDBACK_RLS_POLICIES.sql in Supabase.');
          console.error('RLS Policy Error - Run FIX_FEEDBACK_RLS_POLICIES.sql');
          return;
        }

        // If status column doesn't exist
        if (error.message.includes('status') || error.code === '42703') {
          console.warn('Status column not found, using fallback method');
          const { error: fallbackError } = await supabase
            .from('feedback')
            .update({
              is_resolved: status === 'resolved'
            })
            .eq('id', feedbackId);

          if (fallbackError) {
            toast.error('Failed to update. Run QUICK_NOTIFICATION_SETUP.sql and FIX_FEEDBACK_RLS_POLICIES.sql');
            console.error('Fallback error:', fallbackError);
            return;
          }
          
          toast.warning('Status updated (limited). Run QUICK_NOTIFICATION_SETUP.sql for full functionality.');
        } else {
          toast.error(`Failed to update: ${error.message}`);
          console.error('Update error:', error);
          return;
        }
      } else {
        toast.success(`Status updated to ${status.replace('_', ' ')}`);
      }
      
      fetchFeedbacks();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Check console for details.');
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">The Voice</h1>
            <p className="text-muted-foreground">
              Share your complaints anonymously and make your voice heard
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
                New Complaint
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {feedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onUpvote={handleUpvote}
                onStatusChange={handleStatusChange}
              />
            ))}

            {feedbacks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No complaints found. Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
