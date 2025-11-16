import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bug } from 'lucide-react';

export function DebugUserPermissions() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user, userRole } = useAuth();

  const testPermissions = async () => {
    if (!user) return;
    
    setTesting(true);
    const testResults: any = {};

    try {
      // Test 1: Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      testResults.profile = { data: profile, error: profileError?.message };

      // Test 2: Try to read clubs
      const { data: clubs, error: clubsReadError } = await supabase
        .from('clubs')
        .select('*')
        .limit(1);
      
      testResults.clubsRead = { data: clubs?.length || 0, error: clubsReadError?.message };

      // Test 3: Try to insert a test club (we'll delete it immediately)
      const testClubName = `Test Club ${Date.now()}`;
      const { data: testClub, error: clubInsertError } = await supabase
        .from('clubs')
        .insert({
          profile_id: user.id,
          name: testClubName,
          description: 'Test club for permissions',
          performance_score: 50
        })
        .select()
        .single();

      testResults.clubInsert = { 
        success: !clubInsertError, 
        error: clubInsertError?.message,
        data: testClub?.id 
      };

      // Clean up test club if it was created
      if (testClub) {
        await supabase.from('clubs').delete().eq('id', testClub.id);
      }

      // Test 4: Check auth.uid()
      const { data: authCheck } = await supabase.rpc('auth.uid');
      testResults.authUid = authCheck;

    } catch (error) {
      testResults.generalError = error;
    }

    setResults(testResults);
    setTesting(false);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <Card className="mt-4 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-purple-800 flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Debug Permissions (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Role:</strong> {userRole}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>
        
        <Button onClick={testPermissions} disabled={testing} size="sm">
          {testing ? 'Testing...' : 'Test Database Permissions'}
        </Button>

        {results && (
          <div className="bg-white p-3 rounded border text-xs">
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}