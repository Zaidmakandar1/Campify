import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight, CheckCircle2, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Home() {
  const { userRole } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [completedEvents, setCompletedEvents] = useState<any[]>([]);
  const [resolvedFeedback, setResolvedFeedback] = useState<any[]>([]);
  const [clubRankings, setClubRankings] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchUpcomingEvents();
    fetchCompletedEvents();
    fetchResolvedFeedback();
    fetchClubRankings();
  }, []);

  const fetchUpcomingEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, venues(name), clubs(name)')
      .eq('is_completed', false)
      .order('start_date', { ascending: true })
      .limit(5);
    
    setUpcomingEvents(data || []);
  };

  const fetchCompletedEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*, venues(name), clubs(name)')
      .eq('is_completed', true)
      .order('start_date', { ascending: false })
      .limit(6);
    
    setCompletedEvents(data || []);
  };

  const fetchResolvedFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('is_resolved', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setResolvedFeedback(data || []);
  };

  const fetchClubRankings = async () => {
    const { data: clubs } = await supabase
      .from('clubs')
      .select('*')
      .order('performance_score', { ascending: false });
    
    if (clubs) {
      // Calculate rankings based on performance score
      const rankedClubs = clubs.map((club, index) => ({
        ...club,
        rank: index + 1,
        score: club.performance_score || 50
      }));
      setClubRankings(rankedClubs);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % upcomingEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + upcomingEvents.length) % upcomingEvents.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Events Slider */}
        <Card className="mb-8 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {upcomingEvents.length > 0 ? (
              <div className="relative h-64">
                {/* Slider Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold mb-2">
                            {upcomingEvents[currentSlide]?.title}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {upcomingEvents[currentSlide]?.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(upcomingEvents[currentSlide]?.start_date).toLocaleDateString()}
                            </div>
                            {upcomingEvents[currentSlide]?.venues && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {upcomingEvents[currentSlide]?.venues.name}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {upcomingEvents[currentSlide]?.current_registrations} / {upcomingEvents[currentSlide]?.max_registrations}
                            </div>
                          </div>
                        </div>
                        <Button asChild>
                          <Link to={`/hub/event/${upcomingEvents[currentSlide]?.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                {upcomingEvents.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      onClick={prevSlide}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={nextSlide}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {upcomingEvents.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentSlide ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No upcoming events at the moment
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Wins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Recent Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolvedFeedback.length > 0 ? (
                resolvedFeedback.map((feedback) => (
                  <Link
                    key={feedback.id}
                    to={`/voice/${feedback.id}`}
                    className="block p-4 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{feedback.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Resolved {new Date(feedback.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-green-500">Resolved</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No resolved feedback yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Completed Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Completed Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedEvents.length > 0 ? (
                completedEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/hub/event/${event.id}`}
                    className="block p-4 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>Completed</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No completed events yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Club Rankings Section */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Club Rankings
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Top performing clubs based on engagement and activities
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/market">View Full Rankings</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {clubRankings.length > 0 ? (
              <div className="space-y-3">
                {clubRankings.map((club) => (
                  <div
                    key={club.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors min-h-[80px]"
                  >
                    {/* Rank Badge */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold flex-shrink-0 ${
                      club.rank === 1 ? 'bg-yellow-500 text-white' :
                      club.rank === 2 ? 'bg-gray-400 text-white' :
                      club.rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-muted text-foreground'
                    }`}>
                      {club.rank <= 3 ? (
                        <Trophy className="h-6 w-6" />
                      ) : (
                        `#${club.rank}`
                      )}
                    </div>

                    {/* Club Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{club.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {club.description || 'Student club'}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0 w-20">
                      <div className="text-2xl font-bold text-primary">{club.score}</div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>

                    {/* Trend Indicator */}
                    <div className="flex items-center flex-shrink-0 w-8">
                      {club.score > 70 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : club.score < 40 ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No club rankings available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faculty Admin Section */}
        {userRole === 'faculty' && (
          <Card className="mt-6 border-primary">
            <CardHeader>
              <CardTitle>Faculty Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/voice/admin">Review Feedback</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
