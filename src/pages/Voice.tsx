import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, MessageSquare, Plus, Filter } from 'lucide-react';
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
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link to={`/voice/${feedback.id}`}>
                        <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                          {feedback.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground mt-2 line-clamp-2">
                        {feedback.content}
                      </p>
                    </div>
                    {feedback.is_resolved && (
                      <Badge className="ml-4 bg-green-500">Resolved</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardFooter className="flex items-center gap-4">
                  <Badge className={getCategoryColor(feedback.category)}>
                    {feedback.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpvote(feedback.id)}
                    className="gap-1"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {feedback.upvotes}
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link to={`/voice/${feedback.id}`}>
                      <MessageSquare className="h-4 w-4" />
                      {feedback.feedback_comments?.[0]?.count || 0}
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </CardFooter>
              </Card>
            ))}

            {feedbacks.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No feedback found. Be the first to share!</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
