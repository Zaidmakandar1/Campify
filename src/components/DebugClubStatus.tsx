import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DebugClubStatus() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchClubs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all clubs for this user
      const { data: allClubs, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('profile_id', user.id);

      console.log('Debug - User ID:', user.id);
      console.log('Debug - Clubs found:', allClubs);
      console.log('Debug - Error:', error);

      setClubs(allClubs || []);
    } catch (err) {
      console.error('Debug - Fetch error:', err);
    }
    setLoading(false);
  };

  const createTestClub = async () => {
    if (!user) return;

    try {
      const { data: newClub, error } = await supabase
        .from('clubs')
        .insert({
          profile_id: user.id,
          name: 'Test Club',
          description: 'Test club for debugging',
          performance_score: 50
        })
        .select()
        .single();

      console.log('Test club created:', newClub);
      console.log('Creation error:', error);
      
      if (!error) {
        fetchClubs(); // Refresh the list
      }
    } catch (err) {
      console.error('Test club creation error:', err);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [user]);

  if (!user) return <div>Not logged in</div>;

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Debug: Club Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>User ID:</strong> {user.id}
        </div>
        <div>
          <strong>User Email:</strong> {user.email}
        </div>
        <div>
          <strong>Clubs Found:</strong> {loading ? 'Loading...' : clubs.length}
        </div>
        
        {clubs.length > 0 && (
          <div>
            <strong>Club Details:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(clubs, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={fetchClubs} variant="outline">
            Refresh Clubs
          </Button>
          <Button onClick={createTestClub} variant="outline">
            Create Test Club
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}