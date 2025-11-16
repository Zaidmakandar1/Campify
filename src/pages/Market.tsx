import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiAnalytics, ClubRanking } from '@/lib/aiAnalytics';
import { TrendingUp, TrendingDown, Award, Brain, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Market() {
  const [rankings, setRankings] = useState<ClubRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const clubRankings = await aiAnalytics.calculateClubRankings();
      setRankings(clubRankings);
    } catch (error) {
      toast.error('Failed to load club rankings');
      console.error(error);
    }
    setLoading(false);
  };

  const handleRefreshAnalysis = async () => {
    setAnalyzing(true);
    toast.info('🤖 AI is analyzing club data...');
    
    try {
      const newRankings = await aiAnalytics.calculateClubRankings();
      setRankings(newRankings);
      toast.success('AI analysis completed!');
    } catch (error) {
      toast.error('Analysis failed');
      console.error(error);
    }
    
    setAnalyzing(false);
  };

  // Generate chart data based on AI rankings
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const dataPoint: any = { month };
      rankings.slice(0, 5).forEach((club) => {
        // Simulate performance trend based on AI analysis
        const baseScore = club.engagement_score;
        const trendMultiplier = club.trend === 'up' ? 1.1 : club.trend === 'down' ? 0.9 : 1;
        dataPoint[club.name] = Math.max(0, baseScore * trendMultiplier + (Math.random() - 0.5) * 10);
      });
      return dataPoint;
    });
  };

  const chartData = rankings.length > 0 ? generateChartData() : [];
  const colors = ['#2563EB', '#F97316', '#8B5CF6', '#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                The Market
              </h1>
              <p className="text-muted-foreground">
                AI-powered club performance analysis and real-time rankings
              </p>
            </div>
            <Button 
              onClick={handleRefreshAnalysis}
              disabled={analyzing}
              className="gap-2"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh AI Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* AI Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI-Powered Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankings.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {rankings.slice(0, 5).map((club, index) => (
                        <Line
                          key={club.id}
                          type="monotone"
                          dataKey={club.name}
                          stroke={colors[index]}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>AI analysis in progress...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI-Powered Rankings */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                AI-Powered Club Rankings
              </h2>
              <div className="grid gap-4">
                {rankings.map((club, index) => (
                  <Card key={club.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-muted'
                          }`}>
                            {index < 3 ? (
                              <Award className="h-6 w-6 text-white" />
                            ) : (
                              <span className="font-bold text-foreground">#{club.rank}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{club.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {club.description || 'Student club'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold">{club.engagement_score}</p>
                            <p className="text-sm text-muted-foreground">AI Score</p>
                          </div>
                          <div className={`flex items-center gap-1 ${
                            club.trend === 'up' ? 'text-green-500' :
                            club.trend === 'down' ? 'text-red-500' :
                            'text-gray-500'
                          }`}>
                            {club.trend === 'up' ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : club.trend === 'down' ? (
                              <TrendingDown className="h-5 w-5" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Insights */}
                      {club.insights.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            AI Insights:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {club.insights.slice(0, 3).map((insight, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {insight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {rankings.length === 0 && !loading && (
                  <Card className="p-12 text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No AI analysis available yet</p>
                    <Button onClick={handleRefreshAnalysis}>
                      Start AI Analysis
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
