import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackCardProps {
  feedback: {
    id: string;
    title: string;
    content: string;
    category: string;
    upvotes: number;
    is_resolved: boolean;
    status?: string;
    created_at: string;
    feedback_comments?: { count: number }[];
  };
  onUpvote?: (feedbackId: string) => void;
  onStatusChange?: (feedbackId: string, status: string) => void;
  showActions?: boolean;
}

export function FeedbackCard({ feedback, onUpvote, onStatusChange, showActions = true }: FeedbackCardProps) {
  const { userRole } = useAuth();
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      facilities: 'bg-primary text-white',
      academics: 'bg-success text-white',
      events: 'bg-accent text-white',
      administration: 'bg-orange-500 text-white',
      other: 'bg-gray-500 text-white',
    };
    return colors[category] || colors.other;
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-accent text-white' },
      in_process: { label: 'In Process', className: 'bg-primary text-white' },
      resolved: { label: 'Resolved', className: 'bg-success text-white' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-all h-full flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-h-[120px]">
            <Link to={`/voice/${feedback.id}`}>
              <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2 mb-2">
                {feedback.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {feedback.content}
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {getStatusBadge(feedback.status || (feedback.is_resolved ? 'resolved' : 'pending'))}
            
            {/* Faculty Status Control */}
            {userRole === 'faculty' && onStatusChange && (
              <Select
                value={feedback.status || (feedback.is_resolved ? 'resolved' : 'pending')}
                onValueChange={(value) => onStatusChange(feedback.id, value)}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_process">In Process</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardFooter className="flex items-center gap-2 flex-wrap pt-4 mt-auto border-t">
        <Badge className={`${getCategoryColor(feedback.category)} text-xs`}>
          {feedback.category}
        </Badge>
        
        {showActions && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote?.(feedback.id)}
              className="gap-1 h-8 px-2 hover:bg-primary/10 hover:text-primary"
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="text-xs">{feedback.upvotes}</span>
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-1 h-8 px-2 hover:bg-primary/10 hover:text-primary">
              <Link to={`/voice/${feedback.id}`}>
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs">{feedback.feedback_comments?.[0]?.count || 0}</span>
              </Link>
            </Button>
          </>
        )}
        
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(feedback.created_at).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
  );
}