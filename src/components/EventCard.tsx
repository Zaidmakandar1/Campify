import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    max_registrations: number;
    current_registrations: number;
    is_completed: boolean;
    image_url?: string | null;
    venues?: { name: string } | null;
    clubs?: { name: string } | null;
  };
  showClubName?: boolean;
}

export function EventCard({ event, showClubName = true }: EventCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Calendar className="h-16 w-16 text-primary" />
        )}
      </div>
      
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          {event.is_completed ? (
            <Badge className="bg-green-500 ml-2">Completed</Badge>
          ) : (
            <Badge className="ml-2">Upcoming</Badge>
          )}
        </div>
        {showClubName && event.clubs && (
          <p className="text-sm text-muted-foreground">
            by {event.clubs.name}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {event.description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(event.start_date).toLocaleDateString()}
          </div>
          {event.venues && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {event.venues.name}
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {event.current_registrations} / {event.max_registrations} registered
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/hub/event/${event.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}