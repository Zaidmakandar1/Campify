import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  is_resolved: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function VoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      // Defensive: don't treat reserved paths like "admin" or "new" as a feedback id
      if (id === 'admin' || id === 'new') {
        navigate('/voice');
        return;
      }
      fetchFeedback();
      fetchComments();
    }
  }, [id]);

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load feedback');
      console.error(error);
    } else {
      setFeedback(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('feedback_comments')
      .select('id, content, created_at, created_by')
      .eq('feedback_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          if (comment.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', comment.created_by)
              .single();
            return { ...comment, profiles: profile };
          }
          return { ...comment, profiles: null };
        })
      );
      setComments(commentsWithProfiles as Comment[]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('feedback_comments')
      .insert({
        feedback_id: id!,
        content: newComment
      });

    if (error) {
      toast.error('Failed to add comment');
      console.error(error);
    } else {
      toast.success('Comment added');
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleUpvote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !feedback) return;

    const { data: existingUpvote } = await supabase
      .from('feedback_upvotes')
      .select()
      .eq('feedback_id', feedback.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingUpvote) {
      await supabase.from('feedback_upvotes').delete().eq('id', existingUpvote.id);
      toast.success('Upvote removed');
    } else {
      await supabase
        .from('feedback_upvotes')
        .insert({
          feedback_id: feedback.id,
          user_id: user.id
        });
      toast.success('Upvoted!');
    }

    fetchFeedback();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      facilities: 'bg-blue-500',
      academics: 'bg-green-500',
      events: 'bg-purple-500',
      administration: 'bg-orange-500',
      other: 'bg-gray-500',
    };
    return colors[category] || colors.other;
  };

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

  if (!feedback) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Complaint not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/voice">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Link>
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{feedback.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(feedback.category)}>
                    {feedback.category}
                  </Badge>
                  {feedback.is_resolved && (
                    <Badge className="bg-green-500">Resolved</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button onClick={handleUpvote} variant="outline" className="gap-2">
                <ThumbsUp className="h-4 w-4" />
                {feedback.upvotes}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg whitespace-pre-wrap">{feedback.content}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-4">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button type="submit" disabled={submitting || !newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-4 border-t">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">
                      {comment.profiles?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
