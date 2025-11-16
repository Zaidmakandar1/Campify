import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Wifi, Car, Coffee } from 'lucide-react';

interface VenueCardProps {
  venue: {
    id: string;
    name: string;
    description: string;
    capacity: number;
    image_url?: string;
    amenities?: string[];
  };
  linkTo?: string;
}

export function VenueCard({ venue, linkTo }: VenueCardProps) {
  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, any> = {
      wifi: Wifi,
      parking: Car,
      catering: Coffee,
      projector: MapPin,
    };
    const Icon = icons[amenity.toLowerCase()] || MapPin;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <MapPin className="h-16 w-16 text-primary" />
      </div>
      
      <CardHeader className="flex-1">
        <CardTitle className="text-xl">{venue.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {venue.description || 'Available for booking'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Capacity: {venue.capacity} people</span>
        </div>
        
        {venue.amenities && venue.amenities.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Amenities:</p>
            <div className="flex flex-wrap gap-2">
              {venue.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <span className="mr-1">{getAmenityIcon(amenity)}</span>
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <div className="p-6 pt-0">
        {linkTo ? (
          <Button asChild className="w-full">
            <Link to={linkTo}>
              View Details & Book
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full">
            View Only (Club Access Required)
          </Button>
        )}
      </div>
    </Card>
  );
}