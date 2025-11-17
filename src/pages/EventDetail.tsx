import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, MapPin, Users, Star, Send, Edit, Trash2, UserPlus, Download } from 'lucide-react';
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
  group_size: number | null;
  total_people: number | null;
  venues: { name: string } | null;
  clubs: { name: string; profile_id: string } | null;
  event_pics: string[] | null;
  winner_pics: string[] | null;
  closing_remarks: string | null;
  winner_details: string | null;
  attendance: number | null;
}

interface TeamMember {
  name: string;
  email: string;
  phone: string;
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
  const [newReview, setNewReview] = useState({ 
    rating: 5, 
    comment: '',
    organizationRating: 3,
    usefulnessRating: 3,
    wouldAttendAgain: 'yes'
  });
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLeaderName, setTeamLeaderName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: '', email: '', phone: '' }]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionData, setCompletionData] = useState({
    attendance: '',
    closingRemarks: '',
    winnerDetails: ''
  });
  const [eventPics, setEventPics] = useState<File[]>([]);
  const [winnerPics, setWinnerPics] = useState<File[]>([]);

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

    if (isRegistered) {
      // Unregister
      setRegistering(true);
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
      setRegistering(false);
    } else {
      // Debug: Log event details
      console.log('Event group_size:', event.group_size);
      console.log('Event total_people:', event.total_people);
      console.log('Full event:', event);
      
      // Check if event requires team formation
      if (event.group_size && event.group_size > 1) {
        console.log('Opening team dialog');
        // Show team formation dialog
        setShowTeamDialog(true);
      } else {
        console.log('Simple registration (no team)');
        // Simple registration without team
        await registerWithoutTeam();
      }
    }
  };

  const registerWithoutTeam = async () => {
    if (!user || !event) return;

    setRegistering(true);

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

    setRegistering(false);
  };

  const handleTeamRegistration = async () => {
    if (!user || !event) return;

    // Validate team data
    if (!teamLeaderName.trim()) {
      toast.error('Please enter team leader name');
      return;
    }

    const validMembers = teamMembers.filter(m => m.name.trim());
    if (event.group_size && validMembers.length !== event.group_size) {
      toast.error(`Please enter exactly ${event.group_size} team members`);
      return;
    }

    setRegistering(true);

    try {
      if (event.current_registrations >= event.max_registrations) {
        toast.error('Event is full');
        setRegistering(false);
        return;
      }

      // Insert registration
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
          team_name: teamName.trim() || null,
          team_leader_name: teamLeaderName.trim()
        })
        .select()
        .single();

      if (regError) {
        console.error('Registration error:', regError);
        toast.error(`Failed to register: ${regError.message}`);
        setRegistering(false);
        return;
      }

      // Insert team members
      if (validMembers.length > 0) {
        const membersData = validMembers.map((member, index) => ({
          registration_id: registration.id,
          member_name: member.name.trim(),
          member_email: member.email.trim() || null,
          member_phone: member.phone.trim() || null,
          position: index + 1
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(membersData);

        if (membersError) {
          console.error('Failed to save team members:', membersError);
          toast.error(`Team members error: ${membersError.message}`);
          // Don't fail the registration, just log the error
        }
      }

      toast.success('Team registered successfully!');
      setIsRegistered(true);
      setShowTeamDialog(false);
      
      // Reset form
      setTeamName('');
      setTeamLeaderName('');
      setTeamMembers([{ name: '', email: '', phone: '' }]);

      // Update registration count
      await supabase
        .from('events')
        .update({ current_registrations: event.current_registrations + 1 })
        .eq('id', id);
      
      fetchEvent();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setRegistering(false);
    }
  };

  const addTeamMember = () => {
    if (event?.group_size && teamMembers.length >= event.group_size) {
      toast.error(`Maximum ${event.group_size} members allowed`);
      return;
    }
    setTeamMembers([...teamMembers, { name: '', email: '', phone: '' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
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
        comment: newReview.comment,
        organization_rating: newReview.organizationRating,
        usefulness_rating: newReview.usefulnessRating,
        would_attend_again: newReview.wouldAttendAgain === 'yes'
      });

    if (error) {
      toast.error('Failed to submit review');
      console.error(error);
    } else {
      toast.success('Feedback submitted!');
      setNewReview({ 
        rating: 5, 
        comment: '',
        organizationRating: 3,
        usefulnessRating: 3,
        wouldAttendAgain: 'yes'
      });
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

  const uploadImagesToStorage = async (files: File[], folder: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${event!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('event-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    return uploadedUrls;
  };

  const handleMarkComplete = async () => {
    if (!event) return;

    // Validate attendance
    const attendance = parseInt(completionData.attendance);
    if (isNaN(attendance) || attendance < 0) {
      toast.error('Please enter a valid attendance number');
      return;
    }

    try {
      toast.info('Uploading images...');

      // Upload event pictures
      const eventPicUrls = eventPics.length > 0 
        ? await uploadImagesToStorage(eventPics, 'event-gallery')
        : [];

      // Upload winner pictures
      const winnerPicUrls = winnerPics.length > 0
        ? await uploadImagesToStorage(winnerPics, 'winners')
        : [];

      if (eventPics.length > 0 && eventPicUrls.length === 0) {
        toast.error('Failed to upload event pictures');
        return;
      }

      if (winnerPics.length > 0 && winnerPicUrls.length === 0) {
        toast.error('Failed to upload winner pictures');
        return;
      }
      
      const { error } = await supabase
        .from('events')
        .update({
          is_completed: true,
          attendance: attendance,
          closing_remarks: completionData.closingRemarks,
          winner_details: completionData.winnerDetails,
          event_pics: eventPicUrls.length > 0 ? eventPicUrls : null,
          winner_pics: winnerPicUrls.length > 0 ? winnerPicUrls : null
        })
        .eq('id', event.id);

      if (error) {
        toast.error('Failed to mark event as complete');
        console.error(error);
      } else {
        toast.success('Event marked as complete!');
        setShowCompleteDialog(false);
        setEventPics([]);
        setWinnerPics([]);
        fetchEvent();
      }
    } catch (error) {
      console.error('Error marking event complete:', error);
      toast.error('An error occurred');
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
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/hub">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Link>
        </Button>

        <div className={`grid gap-6 ${event.is_completed ? 'lg:grid-cols-[2fr_2fr_1fr]' : 'lg:grid-cols-4'}`}>
          {/* Event Details */}
          <div className={event.is_completed ? '' : 'lg:col-span-3'}>
            <div className="space-y-6">
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
                  {event.group_size && event.group_size > 1 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      Team Event ({event.group_size} per team)
                    </div>
                  )}
                </div>
                
                {event.group_size && event.group_size > 1 && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Team Registration Required:</strong> This event requires teams of {event.group_size} members. 
                      You'll be asked to provide team details when registering.
                    </p>
                  </div>
                )}
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
                      <h4 className="font-medium text-lg">Share Your Event Feedback</h4>
                      
                      <div className="space-y-2">
                        <Label>How would you rate this event overall? *</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              type="button"
                              variant={newReview.rating === rating ? "default" : "outline"}
                              onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                              className="w-12"
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>How organized was the event? *</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              type="button"
                              variant={newReview.organizationRating === rating ? "default" : "outline"}
                              onClick={() => setNewReview(prev => ({ ...prev, organizationRating: rating }))}
                              className="w-12"
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>How useful was the event? *</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              type="button"
                              variant={newReview.usefulnessRating === rating ? "default" : "outline"}
                              onClick={() => setNewReview(prev => ({ ...prev, usefulnessRating: rating }))}
                              className="w-12"
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Would you attend an event from this club again? *</Label>
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant={newReview.wouldAttendAgain === 'yes' ? "default" : "outline"}
                            onClick={() => setNewReview(prev => ({ ...prev, wouldAttendAgain: 'yes' }))}
                            className="flex-1"
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={newReview.wouldAttendAgain === 'no' ? "default" : "outline"}
                            onClick={() => setNewReview(prev => ({ ...prev, wouldAttendAgain: 'no' }))}
                            className="flex-1"
                          >
                            No
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Comments (Optional)</Label>
                        <Textarea
                          placeholder="Share your thoughts about the event..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                          maxLength={500}
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {newReview.comment.length}/500 characters
                        </p>
                      </div>

                      <Button type="submit" disabled={submittingReview} size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        {submittingReview ? 'Submitting...' : 'Submit Feedback'}
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
                              Anonymous
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
          </div>

          {/* Middle Column - Galleries (only for completed events) */}
          {event.is_completed && (
            <div className="space-y-6">
              {/* Event Pictures */}
              {event.event_pics && event.event_pics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Gallery</CardTitle>
                    <CardDescription>Photos from the event</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {event.event_pics.map((pic, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={pic}
                            alt={`Event photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(pic, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Winner Pictures */}
              {event.winner_pics && event.winner_pics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Winner Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {event.winner_pics.map((pic, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={pic}
                            alt={`Winner photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(pic, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <Link to={`/club/events/${event.id}/registrations`}>
                        <Download className="h-4 w-4 mr-2" />
                        View Registrations
                      </Link>
                    </Button>
                    {!event.is_completed && (
                      <Button
                        onClick={() => setShowCompleteDialog(true)}
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Mark as Complete
                      </Button>
                    )}
                    <Button
                      onClick={handleDeleteEvent}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Event Completion Details in Sidebar */}
            {event.is_completed && (
              <>
                {/* Event Statistics */}
                {event.attendance && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="text-lg"><strong>{event.attendance}</strong> people attended</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Closing Remarks */}
                {event.closing_remarks && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Closing Remarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{event.closing_remarks}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Winner Details (text only) */}
                {event.winner_details && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Winner Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">{event.winner_details}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Team Registration Dialog */}
        <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Team Registration</DialogTitle>
              <DialogDescription>
                Enter your team details. {event?.group_size && `Team size: ${event.group_size} members`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name (Optional)</Label>
                <Input
                  id="team_name"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_leader">Team Leader Name *</Label>
                <Input
                  id="team_leader"
                  placeholder="Enter team leader name"
                  value={teamLeaderName}
                  onChange={(e) => setTeamLeaderName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Team Members *</Label>
                  {(!event?.group_size || teamMembers.length < event.group_size) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTeamMember}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  )}
                </div>

                {teamMembers.map((member, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Member {index + 1}</h4>
                        {teamMembers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor={`member_name_${index}`}>Name *</Label>
                          <Input
                            id={`member_name_${index}`}
                            placeholder="Full name"
                            value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`member_email_${index}`}>Email (Optional)</Label>
                          <Input
                            id={`member_email_${index}`}
                            type="email"
                            placeholder="email@example.com (optional)"
                            value={member.email}
                            onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`member_phone_${index}`}>Phone (Optional)</Label>
                          <Input
                            id={`member_phone_${index}`}
                            type="tel"
                            placeholder="+1234567890 (optional)"
                            value={member.phone}
                            onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowTeamDialog(false)}
                  disabled={registering}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleTeamRegistration}
                  disabled={registering}
                >
                  {registering ? 'Registering...' : 'Register Team'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mark as Complete Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark Event as Complete</DialogTitle>
              <DialogDescription>
                Please provide event completion details and feedback
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="attendance">Event Attendance *</Label>
                <Input
                  id="attendance"
                  type="number"
                  placeholder="Number of attendees"
                  value={completionData.attendance}
                  onChange={(e) => setCompletionData({...completionData, attendance: e.target.value})}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingRemarks">Closing Remarks</Label>
                <Textarea
                  id="closingRemarks"
                  placeholder="Share closing remarks about the event..."
                  value={completionData.closingRemarks}
                  onChange={(e) => setCompletionData({...completionData, closingRemarks: e.target.value})}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventPics">Event Pictures</Label>
                <Input
                  id="eventPics"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setEventPics(Array.from(e.target.files || []))}
                />
                <p className="text-xs text-muted-foreground">
                  Upload photos from the event (multiple files allowed)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="winnerDetails">Winner Details</Label>
                <Textarea
                  id="winnerDetails"
                  placeholder="Enter winner names, positions, and details..."
                  value={completionData.winnerDetails}
                  onChange={(e) => setCompletionData({...completionData, winnerDetails: e.target.value})}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="winnerPics">Winner Pictures</Label>
                <Input
                  id="winnerPics"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setWinnerPics(Array.from(e.target.files || []))}
                />
                <p className="text-xs text-muted-foreground">
                  Upload podium/winner photos (multiple files allowed)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCompleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleMarkComplete}
                >
                  Mark as Complete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}