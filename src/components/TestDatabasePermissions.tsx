import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TestTube } from 'lucide-react';
import { toast } from 'sonner';

export function TestDatabasePermissions() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user, userRole } = useAuth();

  const runTests = async () => {
    if (!user) {
      toast.error('You must be logged in to test permissions');
      return;
    }

    setTesting(true);
    const testResults: any = {};

    try {
      // Test 1: Check user debug function
      const { data: debugInfo, error: debugError } = await supabase
        .rpc('simple_user_debug');
      
      testResults.debugInfo = { data: debugInfo, error: debugError?.message };

      // Test 2: Try to read clubs
      const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name')
        .limit(5);
      
      testResults.clubsRead = { 
        success: !clubsError, 
        count: clubs?.length || 0, 
        error: clubsError?.message 
      };

      // Test 3: Try to create a test club
      const testClubName = `Test Club ${Date.now()}`;
      const { data: testClub, error: clubCreateError } = await supabase
        .from('clubs')
        .insert({
          profile_id: user.id,
          name: testClubName,
          description: 'Test club for permissions',
          performance_score: 50
        })
        .select('id')
        .single();

      testResults.clubCreate = {
        success: !clubCreateError,
        error: clubCreateError?.message,
        clubId: testClub?.id
      };

      // Clean up test club
      if (testClub) {
        await supabase.from('clubs').delete().eq('id', testClub.id);
      }

      // Test 4: Try to read venues
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id, name')
        .limit(3);
      
      testResults.venuesRead = {
        success: !venuesError,
        count: venues?.length || 0,
        error: venuesError?.message
      };

      toast.success('Permission tests completed!');
    } catch (error) {
      testResults.generalError = error;
      toast.error('Test failed with error');
    }

    setResults(testResults);
    setTesting(false);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <Card className="mt-4 border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Database Permission Tests (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><strong>User:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {userRole}</p>
        </div>
        
        <Button onClick={runTests} disabled={testing} size="sm">
          {testing ? 'Testing...' : 'Run Permission Tests'}
        </Button>

        {results && (
          <div className="bg-white p-3 rounded border text-xs max-h-64 overflow-auto">
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}