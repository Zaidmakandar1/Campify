import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, MapPin, Users, Star, Send, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  start_date: string;
  max_registrations: number;
  current_registrations: number;
  is_completed: boolean;
  club_id: string;
  venues: { name: string } | null;
  clubs: { name: string; profile_id: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchEvent();
      fetchReviews();
      checkRegistration();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*, venues(name), clubs(name, profile_id)')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load event');
      console.error(error);
    } else {
      setEvent(data);
      // Check if current user is the event owner
      if (data.clubs && data.clubs.profile_id === user?.id) {
        setIsOwner(true);
      }
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('event_reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      // Fetch profile names for reviews
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();
          return { ...review, profiles: profile };
        })
      );
      setReviews(reviewsWithProfiles as Review[]);
    }
  };

  const checkRegistration = async () => {
    const { data } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user?.id)
      .single();

    setIsRegistered(!!data);
  };

  const handleRegistration = async () => {
    if (!user || !event) return;

    setRegistering(true);

    if (isRegistered) {
      // Unregister
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to unregister');
      } else {
        toast.success('Unregistered successfully');
        setIsRegistered(false);
        // Update registration count
        await supabase
          .from('events')
          .update({ current_registrations: event.current_registrations - 1 })
          .eq('id', id);
        fetchEvent();
      }
    } else {
      // Register
      if (event.current_registrations >= event.max_registrations) {
        toast.error('Event is full');
        setRegistering(false);
        return;
      }

      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id
        });

      if (error) {
        toast.error('Failed to register');
      } else {
        toast.success('Registered successfully!');
        setIsRegistered(true);
        // Update registration count
        await supabase
          .from('events')
          .update({ current_registrations: event.current_registrations + 1 })
          .eq('id', id);
        fetchEvent();
      }
    }

    setRegistering(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event || !isRegistered) return;

    setSubmittingReview(true);

    const { error } = await supabase
      .from('event_reviews')
      .insert({
        event_id: id,
        user_id: user.id,
        rating: newReview.rating,
        comment: newReview.comment
      });

    if (error) {
      toast.error('Failed to submit review');
      console.error(error);
    } else {
      toast.success('Review submitted!');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    }

    setSubmittingReview(false);
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone. All registrations will be cancelled.'
    );
    
    if (!confirmed) return;

    try {
      // Delete old image if it exists
      if (event.image_url) {
        const urlParts = event.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const clubId = urlParts[urlParts.length - 2];
        
        await supabase.storage
          .from('event-images')
          .remove([`${clubId}/${fileName}`])
          .catch(() => {
            // Ignore error if image doesn't exist
          });
      }

      // Delete event (cascades to registrations and reviews)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) {
        toast.error('Failed to delete event');
        console.error(error);
      } else {
        toast.success('Event deleted successfully');
        // Redirect to hub after short delay
        setTimeout(() => {
          window.location.href = '/hub';
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('An error occurred while deleting the event');
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
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

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/hub">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="h-64 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center rounded-t-lg overflow-hidden">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Calendar className="h-24 w-24 text-primary" />
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
                    {event.clubs && (
                      <p className="text-muted-foreground mb-4">
                        Organized by {event.clubs.name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {event.is_completed ? (
                        <Badge className="bg-green-500">Completed</Badge>
                      ) : (
                        <Badge>Upcoming</Badge>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="ml-2"
                    >
                      <Link to={`/club/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Event
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">{event.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.start_date).toLocaleString()}
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
            </Card>

            {/* Reviews Section */}
            {event.is_completed && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews & Ratings</CardTitle>
                  <CardDescription>
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    {averageRating > 0 && ` • Average: ${averageRating.toFixed(1)}/5`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add Review Form (only for registered users) */}
                  {isRegistered && (
                    <form onSubmit={handleReviewSubmit} className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Share your experience</h4>
                      <div>
                        <p className="text-sm mb-2">Rating:</p>
                        {renderStars(newReview.rating, true, (rating) => 
                          setNewReview(prev => ({ ...prev, rating }))
                        )}
                      </div>
                      <Textarea
                        placeholder="Write your review..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        rows={3}
                        className="resize-none"
                      />
                      <Button type="submit" disabled={submittingReview} size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">
                              {review.profiles?.full_name || 'Anonymous'}
                            </p>
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}

                    {reviews.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No reviews yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Registration Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {event.is_completed ? 'Event Completed' : 'Registration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!event.is_completed && (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {event.current_registrations} / {event.max_registrations}
                      </p>
                      <p className="text-sm text-muted-foreground">registered</p>
                    </div>
                    
                    <Button
                      onClick={handleRegistration}
                      disabled={registering || (!isRegistered && event.current_registrations >= event.max_registrations)}
                      className="w-full"
                      variant={isRegistered ? "outline" : "default"}
                    >
                      {registering 
                        ? 'Processing...' 
                        : isRegistered 
                          ? 'Unregister' 
                          : event.current_registrations >= event.max_registrations
                            ? 'Event Full'
                            : 'Register Now'
                      }
                    </Button>

                    {isRegistered && (
                      <p className="text-sm text-green-600 text-center">
                        ✓ You're registered for this event
                      </p>
                    )}
                  </>
                )}

                {event.is_completed && isRegistered && (
                  <p className="text-sm text-muted-foreground text-center">
                    Thanks for attending! Share your experience above.
                  </p>
                )}

                {isOwner && (
                  <Button
                    onClick={handleDeleteEvent}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}