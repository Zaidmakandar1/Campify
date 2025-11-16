import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiAnalytics, UserInsight } from '@/lib/aiAnalytics';
import { ollamaService } from '@/lib/ollamaService';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, TrendingUp, Award, Target, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AIInsightsDashboard() {
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [featureUsage, setFeatureUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkOllamaStatus();
      fetchInsights();
      fetchFeatureUsage();
    }
  }, [user]);

  const checkOllamaStatus = async () => {
    try {
      const available = await ollamaService.isAvailable();
      setOllamaStatus(available ? 'available' : 'unavailable');
    } catch (error) {
      setOllamaStatus('unavailable');
    }
  };

  const fetchInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Track this page view
      await aiAnalytics.trackActivity({
        user_id: user.id,
        activity_type: 'page_view',
        target_type: 'dashboard',
        metadata: { page: 'ai_insights' }
      });

      const userInsights = await aiAnalytics.getUserInsights(user.id);
      setInsights(userInsights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to load AI insights');
    }
    setLoading(false);
  };

  const fetchFeatureUsage = async () => {
    try {
      const usage = await aiAnalytics.getFeatureUsage();
      setFeatureUsage(usage);
    } catch (error) {
      console.error('Error fetching feature usage:', error);
    }
  };

  const handleRefreshInsights = async () => {
    toast.info('🤖 Generating fresh AI insights...');
    await fetchInsights();
    toast.success('AI insights updated!');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'recommendation':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Brain className="h-4 w-4 text-primary" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'border-yellow-200 bg-yellow-50';
      case 'recommendation':
        return 'border-blue-200 bg-blue-50';
      case 'trend':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-primary/20 bg-primary/5';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI Analytics Status</CardTitle>
            </div>
            <Button 
              onClick={handleRefreshInsights}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              className={
                ollamaStatus === 'available' 
                  ? 'bg-green-500' 
                  : ollamaStatus === 'unavailable'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }
            >
              {ollamaStatus === 'checking' && 'Checking...'}
              {ollamaStatus === 'available' && '🤖 Ollama AI Active'}
              {ollamaStatus === 'unavailable' && '⚠️ Ollama Offline'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {ollamaStatus === 'available' && 'Advanced AI insights enabled'}
              {ollamaStatus === 'unavailable' && 'Using fallback analytics'}
              {ollamaStatus === 'checking' && 'Connecting to AI service...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Personal Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Your AI Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <Badge className="mt-2" variant="outline">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet. Interact more with the platform!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Usage Analytics</CardTitle>
          <CardDescription>
            How students are using Campify features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(featureUsage).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(featureUsage).map(([feature, count]) => (
                <div key={feature} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {feature.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Usage analytics will appear as students interact with the platform</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}