import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
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

interface Club {
  id: string;
  name: string;
  performance_score: number;
  description: string;
}

export default function Market() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('performance_score', { ascending: false });

    if (error) {
      toast.error('Failed to load clubs');
      console.error(error);
    } else {
      setClubs(data || []);
    }
    setLoading(false);
  };

  // Generate mock historical data for visualization
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const dataPoint: any = { month };
      clubs.slice(0, 5).forEach((club) => {
        // Simulate performance trend
        dataPoint[club.name] = Math.max(0, club.performance_score + (Math.random() - 0.5) * 20 * (6 - index));
      });
      return dataPoint;
    });
  };

  const chartData = clubs.length > 0 ? generateChartData() : [];
  const colors = ['#2563EB', '#F97316', '#8B5CF6', '#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">The Market</h1>
          <p className="text-muted-foreground">
            Track club performance and gamified rankings
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Club Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {clubs.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {clubs.slice(0, 5).map((club, index) => (
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
                    No club data available yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rankings */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Club Rankings</h2>
              <div className="grid gap-4">
                {clubs.map((club, index) => (
                  <Card key={club.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-6">
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
                            <span className="font-bold text-foreground">#{index + 1}</span>
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
                          <p className="text-2xl font-bold">{club.performance_score}</p>
                          <p className="text-sm text-muted-foreground">Performance Score</p>
                        </div>
                        {index > 0 && clubs[index - 1] && (
                          <div className={`flex items-center gap-1 ${
                            club.performance_score >= clubs[index - 1].performance_score
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}>
                            {club.performance_score >= clubs[index - 1].performance_score ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : (
                              <TrendingDown className="h-5 w-5" />
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {clubs.length === 0 && (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">No clubs registered yet</p>
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
