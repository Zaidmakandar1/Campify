import { supabase } from '@/integrations/supabase/client';
import { ollamaService } from './ollamaService';

export interface ClubRanking {
  id: string;
  name: string;
  description: string;
  performance_score: number;
  engagement_score: number;
  trend: 'up' | 'down' | 'stable';
  rank: number;
  insights: string[];
}

export interface UserInsight {
  type: 'recommendation' | 'trend' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  metadata?: any;
}

export interface ActivityData {
  user_id: string;
  activity_type: string;
  target_type?: string;
  target_id?: string;
  metadata?: any;
}

class AIAnalyticsService {
  private rankingsCache: { data: ClubRanking[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CONCURRENT_AI = 3; // Limit concurrent Ollama requests

  // Track user activity
  async trackActivity(activity: ActivityData) {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          target_type: activity.target_type,
          target_id: activity.target_id,
          metadata: activity.metadata || {}
        });

      if (error) {
        console.error('Error tracking activity:', error);
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // Calculate real-time club rankings using Ollama AI
  async calculateClubRankings(): Promise<ClubRanking[]> {
    try {
      // Check cache first
      if (this.rankingsCache && Date.now() - this.rankingsCache.timestamp < this.CACHE_TTL) {
        console.log('📦 Using cached club rankings...');
        return this.rankingsCache.data;
      }

      console.log('🤖 Starting AI-powered club ranking analysis...');
      
      // Check if Ollama is available
      const ollamaAvailable = await ollamaService.isAvailable();
      console.log('Ollama available:', ollamaAvailable);

      // Get clubs (limit to avoid huge datasets)
      const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('id,name,description,performance_score')
        .limit(50);

      if (clubsError) throw clubsError;
      if (!clubs || clubs.length === 0) return [];

      // Get recent events (90 days) - optimized query
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id,club_id,created_at,current_registrations,max_registrations')
        .gte('created_at', ninetyDaysAgo);

      if (eventsError) throw eventsError;

      // Create lookup map for events by club_id (O(1) lookup instead of O(n) filter)
      const eventsByClub = new Map<string, any[]>();
      (events || []).forEach(event => {
        if (!eventsByClub.has(event.club_id)) {
          eventsByClub.set(event.club_id, []);
        }
        eventsByClub.get(event.club_id)!.push(event);
      });

      // Get feedback mentions (limit to recent feedback)
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .select('id,content')
        .limit(500);

      if (feedbackError) throw feedbackError;

      // Process clubs with concurrency limiting
      const rankings: ClubRanking[] = [];
      for (let i = 0; i < clubs.length; i += this.MAX_CONCURRENT_AI) {
        const batch = clubs.slice(i, i + this.MAX_CONCURRENT_AI);
        const batchResults = await Promise.all(
          batch.map(club => this.analyzeClub(club, eventsByClub, feedback, ollamaAvailable))
        );
        rankings.push(...batchResults);
      }

      // Sort by engagement score and assign ranks
      rankings.sort((a, b) => b.engagement_score - a.engagement_score);
      rankings.forEach((club, index) => {
        club.rank = index + 1;
      });

      console.log('🏆 Club rankings calculated:', rankings.slice(0, 5).map(r => `${r.rank}. ${r.name} (${r.engagement_score})`));

      // Cache the results
      this.rankingsCache = { data: rankings, timestamp: Date.now() };

      return rankings;
    } catch (error) {
      console.error('Error calculating club rankings:', error);
      return [];
    }
  }

  // Analyze a single club with timeout
  private async analyzeClub(
    club: any,
    eventsByClub: Map<string, any[]>,
    feedback: any[],
    ollamaAvailable: boolean
  ): Promise<ClubRanking> {
    const recentEvents = eventsByClub.get(club.id) || [];
    
    // Calculate engagement metrics
    const eventCount = recentEvents.length;
    const avgAttendance = recentEvents.length > 0 
      ? recentEvents.reduce((sum, e) => sum + (e.current_registrations / Math.max(e.max_registrations, 1)), 0) / recentEvents.length
      : 0;

    // Count feedback mentions (efficient search)
    const mentions = feedback?.filter(f => 
      f.content?.toLowerCase().includes(club.name.toLowerCase())
    ).length || 0;

    let aiAnalysis;
    
    if (ollamaAvailable) {
      try {
        // Use Ollama for AI-powered analysis with timeout
        aiAnalysis = await Promise.race([
          ollamaService.analyzeClubData({
            name: club.name,
            description: club.description,
            eventCount,
            avgAttendance,
            mentions,
            performance_score: club.performance_score || 0
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ollama timeout')), 5000) // 5 second timeout
          )
        ]);
      } catch (aiError) {
        console.warn(`AI analysis timeout/failed for ${club.name}, using fallback`);
        aiAnalysis = this.fallbackClubAnalysis(club, { eventCount, avgAttendance, mentions });
      }
    } else {
      aiAnalysis = this.fallbackClubAnalysis(club, { eventCount, avgAttendance, mentions });
    }

    return {
      id: club.id,
      name: club.name,
      description: club.description || '',
      performance_score: club.performance_score || 0,
      engagement_score: aiAnalysis.score,
      trend: aiAnalysis.trend,
      rank: 0,
      insights: [...aiAnalysis.insights, ...aiAnalysis.recommendations]
    };
  }

  // Fallback analysis when AI is not available
  private fallbackClubAnalysis(club: any, metrics: any) {
    const { eventCount, avgAttendance, mentions } = metrics;
    
    const insights = [];
    const recommendations = [];
    
    if (eventCount === 0) {
      insights.push("No recent events organized");
      recommendations.push("Plan regular events to boost engagement");
    } else if (eventCount > 5) {
      insights.push("High activity level with multiple events");
    }

    if (avgAttendance < 0.3) {
      insights.push("Low attendance rates need attention");
      recommendations.push("Survey members for preferred event types");
    } else if (avgAttendance > 0.8) {
      insights.push("Excellent attendance rates");
    }

    if (mentions > 0) {
      insights.push(`Mentioned in ${mentions} feedback posts`);
    }

    const score = Math.min(
      (eventCount * 15) + 
      (avgAttendance * 50) + 
      (mentions * 10) + 
      ((club.performance_score || 0) * 0.25),
      100
    );

    return {
      score: Math.round(score),
      trend: eventCount > 2 ? 'up' : eventCount === 0 ? 'down' : 'stable',
      insights,
      recommendations
    };
  }

  // AI-powered engagement score calculation
  private calculateEngagementScore(metrics: {
    eventCount: number;
    avgAttendance: number;
    mentions: number;
    baseScore: number;
  }): number {
    const {
      eventCount,
      avgAttendance,
      mentions,
      baseScore
    } = metrics;

    // Weighted scoring algorithm (AI-inspired)
    const eventWeight = 0.3;
    const attendanceWeight = 0.4;
    const mentionWeight = 0.2;
    const baseWeight = 0.1;

    const eventScore = Math.min(eventCount * 15, 100); // Max 100 for events
    const attendanceScore = avgAttendance * 100; // Already percentage
    const mentionScore = Math.min(mentions * 10, 100); // Max 100 for mentions

    const finalScore = (
      eventScore * eventWeight +
      attendanceScore * attendanceWeight +
      mentionScore * mentionWeight +
      baseScore * baseWeight
    );

    return Math.min(finalScore, 100);
  }

  // Calculate trend using simple AI logic
  private calculateTrend(club: any, recentEvents: any[]): 'up' | 'down' | 'stable' {
    if (recentEvents.length === 0) return 'stable';

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentEventsCount = recentEvents.filter(e => 
      new Date(e.created_at) > oneMonthAgo
    ).length;

    const olderEventsCount = recentEvents.filter(e => 
      new Date(e.created_at) <= oneMonthAgo
    ).length;

    if (recentEventsCount > olderEventsCount) return 'up';
    if (recentEventsCount < olderEventsCount) return 'down';
    return 'stable';
  }

  // Generate AI insights for clubs
  private generateClubInsights(club: any, metrics: any): string[] {
    const insights: string[] = [];

    if (metrics.eventCount === 0) {
      insights.push("No recent events - consider organizing activities to boost engagement");
    } else if (metrics.eventCount > 5) {
      insights.push("High activity level - great job keeping members engaged!");
    }

    if (metrics.avgAttendance < 0.3) {
      insights.push("Low attendance rates - try smaller, more targeted events");
    } else if (metrics.avgAttendance > 0.8) {
      insights.push("Excellent attendance rates - members are highly engaged");
    }

    if (metrics.mentions > 0) {
      insights.push(`Mentioned in ${metrics.mentions} feedback posts - good visibility`);
    }

    if (metrics.engagementScore > 80) {
      insights.push("Top performer - maintain current strategies");
    } else if (metrics.engagementScore < 40) {
      insights.push("Focus on member engagement and event quality");
    }

    return insights;
  }

  // Get personalized user insights using Ollama AI
  async getUserInsights(userId: string): Promise<UserInsight[]> {
    try {
      console.log('🤖 Generating AI-powered user insights...');
      
      // Get user activities
      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const insights: UserInsight[] = [];
      const ollamaAvailable = await ollamaService.isAvailable();

      if (ollamaAvailable && activities && activities.length > 0) {
        try {
          // Use Ollama for AI-powered user insights
          const aiInsights = await ollamaService.generateUserInsights({
            role: profile?.role || 'student',
            activities: activities || []
          });

          // Convert AI insights to our format
          aiInsights.insights.forEach(insight => {
            insights.push({
              type: 'trend',
              title: 'AI Insight',
              description: insight,
              actionable: false
            });
          });

          aiInsights.recommendations.forEach(rec => {
            insights.push({
              type: 'recommendation',
              title: 'AI Recommendation',
              description: rec,
              actionable: true
            });
          });

          aiInsights.achievements.forEach(achievement => {
            insights.push({
              type: 'achievement',
              title: achievement,
              description: 'Congratulations on your engagement!',
              actionable: false
            });
          });

        } catch (aiError) {
          console.warn('AI insights failed, using fallback:', aiError);
          return this.getFallbackUserInsights(activities, profile);
        }
      } else {
        // Fallback to rule-based insights
        return this.getFallbackUserInsights(activities, profile);
      }

      return insights;
    } catch (error) {
      console.error('Error getting user insights:', error);
      return [];
    }
  }

  // Fallback user insights when AI is not available
  private getFallbackUserInsights(activities: any[], profile: any): UserInsight[] {
    const insights: UserInsight[] = [];
    
    // Analyze user behavior patterns
    const activityTypes = activities?.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Generate personalized insights
    if (activityTypes['event_register'] > 3) {
      insights.push({
        type: 'achievement',
        title: 'Event Enthusiast',
        description: 'You\'ve registered for multiple events this month!',
        actionable: false
      });
    }

    if (activityTypes['feedback_submit'] > 0) {
      insights.push({
        type: 'achievement',
        title: 'Voice Contributor',
        description: 'Thank you for sharing feedback to improve campus life',
        actionable: false
      });
    }

    // Recommend based on role
    if (profile?.role === 'student') {
      insights.push({
        type: 'recommendation',
        title: 'Discover New Clubs',
        description: 'Based on your activity, you might enjoy joining new clubs',
        actionable: true,
        metadata: { action: 'explore_clubs' }
      });
    } else if (profile?.role === 'club') {
      insights.push({
        type: 'recommendation',
        title: 'Boost Engagement',
        description: 'Try hosting smaller, interactive events to increase attendance',
        actionable: true,
        metadata: { action: 'create_event' }
      });
    }

    return insights;
  }

  // Store club rankings in database
  private async storeClubRankings(rankings: ClubRanking[]) {
    try {
      // Skip storing insights to avoid database errors for now
      console.log('Club rankings calculated:', rankings.length, 'clubs');
      // TODO: Fix ai_insights table and re-enable storage
    } catch (error) {
      console.error('Error storing club rankings:', error);
    }
  }

  // Get feature usage analytics
  async getFeatureUsage(): Promise<Record<string, number>> {
    try {
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('activity_type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const usage = activities?.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return usage;
    } catch (error) {
      console.error('Error getting feature usage:', error);
      return {};
    }
  }
}

export const aiAnalytics = new AIAnalyticsService();