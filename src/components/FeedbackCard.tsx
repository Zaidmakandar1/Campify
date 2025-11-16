import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare } from 'lucide-react';

interface FeedbackCardProps {
  feedback: {
    id: string;
    title: string;
    content: string;
    category: string;
    upvotes: number;
    is_resolved: boolean;
    created_at: string;
    feedback_comments?: { count: number }[];
  };
  onUpvote?: (feedbackId: string) => void;
  showActions?: boolean;
}

export function FeedbackCard({ feedback, onUpvote, showActions = true }: FeedbackCardProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link to={`/voice/${feedback.id}`}>
              <h3 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2">
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
        
        {showActions && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote?.(feedback.id)}
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
          </>
        )}
        
        <span className="text-sm text-muted-foreground ml-auto">
          {new Date(feedback.created_at).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
  );
}