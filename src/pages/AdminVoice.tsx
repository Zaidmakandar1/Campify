import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, MessageSquare, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

export default function AdminVoice() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const { userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is faculty/admin
    if (userRole && userRole !== 'faculty') {
      navigate('/voice');
      return;
    }
    fetchFeedbacks();
  }, [filter, userRole, navigate]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    let query = supabase
      .from('feedback')
      .select('*, feedback_comments(count)');

    if (filter === 'unresolved') {
      query = query.eq('is_resolved', false);
    } else if (filter === 'resolved') {
      query = query.eq('is_resolved', true);
    } else if (filter === 'popular') {
      query = query.gte('upvotes', 5);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load complaints');
      console.error(error);
    } else {
      setFeedbacks(data || []);
    }
    setLoading(false);
  };

  const handleResolve = async (feedbackId: string, isResolved: boolean) => {
    const { error } = await supabase
      .from('feedback')
      .update({ is_resolved: !isResolved })
      .eq('id', feedbackId);

    if (error) {
      toast.error('Failed to update complaint status');
      console.error(error);
    } else {
      toast.success(isResolved ? 'Marked as unresolved' : 'Marked as resolved');
      fetchFeedbacks();
    }
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    
    // Simulate AI summary generation
    setTimeout(() => {
      const totalFeedback = feedbacks.length;
      const unresolvedCount = feedbacks.filter(f => !f.is_resolved).length;
      const topCategories = feedbacks.reduce((acc, feedback) => {
        acc[feedback.category] = (acc[feedback.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCategory = Object.entries(topCategories)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'facilities';

      const mockSummary = `
📊 **Feedback Summary Report**

**Overview:**
- Total feedback submissions: ${totalFeedback}
- Unresolved issues: ${unresolvedCount}
- Resolution rate: ${Math.round(((totalFeedback - unresolvedCount) / totalFeedback) * 100)}%

**Top Categories:**
${Object.entries(topCategories)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([category, count]) => `- ${category}: ${count} submissions`)
  .join('\n')}

**Key Insights:**
- Most feedback relates to ${topCategory} improvements
- High engagement with ${feedbacks.filter(f => f.upvotes > 5).length} highly upvoted items
- Recent trend shows increased student participation

**Recommended Actions:**
1. Prioritize ${topCategory} improvements
2. Address top 3 most upvoted unresolved issues
3. Communicate progress on resolved items to maintain trust
      `.trim();

      setSummary(mockSummary);
      setGeneratingSummary(false);
      toast.success('Summary generated successfully!');
    }, 2000);
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

  const getCategoryStats = () => {
    const stats = feedbacks.reduce((acc, feedback) => {
      acc[feedback.category] = (acc[feedback.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).sort(([,a], [,b]) => b - a);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard - The Voice</h1>
            <p className="text-muted-foreground">
              Monitor and manage student Complaints
            </p>
          </div>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={generateSummary} disabled={generatingSummary}>
                  <FileText className="h-4 w-4 mr-2" />
                  {generatingSummary ? 'Generating...' : 'Generate Summary'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Complaint Summary Report</DialogTitle>
                  <DialogDescription>
                    AI-generated insights from student Complaints
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  {summary ? (
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                      {summary}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Click "Generate Summary" to create a report</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={() => setSummary('')} variant="outline">
                    Clear
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{feedbacks.length}</p>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {feedbacks.filter(f => !f.is_resolved).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Unresolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {feedbacks.filter(f => f.is_resolved).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {feedbacks.reduce((sum, f) => sum + f.upvotes, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Upvotes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Complaints</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="popular">Popular (5+ upvotes)</SelectItem>
            </SelectContent>
          </Select>
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
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={feedback.is_resolved ? "outline" : "default"}
                        onClick={() => handleResolve(feedback.id, feedback.is_resolved)}
                      >
                        {feedback.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="flex items-center gap-4">
                  <Badge className={getCategoryColor(feedback.category)}>
                    {feedback.category}
                  </Badge>
                  {feedback.is_resolved && (
                    <Badge className="bg-green-500">Resolved</Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    {feedback.upvotes}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {feedback.feedback_comments?.[0]?.count || 0}
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </CardFooter>
              </Card>
            ))}

            {feedbacks.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No Complaints found for the selected filter.</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}