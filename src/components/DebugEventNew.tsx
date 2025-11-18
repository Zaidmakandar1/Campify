import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function DebugEventNew() {
  const { user, session } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkDebugInfo = async () => {
      const info: any = {
        userLoaded: !!user,
        userId: user?.id || 'Not loaded',
        userEmail: user?.email || 'Not loaded',
        sessionExists: !!session,
      };

      try {
        // Check current session
        const { data: { session: currentSession }, error: sessionError } =
          await supabase.auth.getSession();
        info.currentSessionError = sessionError;
        info.sessionValid = !!currentSession;

        // Try to fetch clubs without filter
        const { data: allClubs, error: allClubsError } = await supabase
          .from('clubs')
          .select('*')
          .limit(5);

        info.allClubsError = allClubsError;
        info.allClubsCount = allClubs?.length || 0;
        info.allClubsSample = allClubs?.[0] || 'None';

        // Try to fetch clubs for current user
        if (user?.id) {
          const { data: userClubs, error: userClubsError } = await supabase
            .from('clubs')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle();

          info.userClubsError = userClubsError;
          info.userClub = userClubs || 'None';
        }

        // Check RLS policies
        let policies = null;
        let policiesError: any = 'RPC not available';
        try {
          const result = await supabase
            .rpc('get_policies', { table_name: 'clubs' });
          if (result.error) {
            policiesError = result.error;
          } else {
            policies = result.data;
          }
        } catch (err) {
          policiesError = String(err);
        }

        info.policiesError = policiesError;
        info.policiesAvailable = !!policies;
      } catch (error) {
        info.debugError = String(error);
      }

      setDebugInfo(info);
    };

    checkDebugInfo();
  }, [user, session]);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs font-mono overflow-auto max-h-96">
      <h4 className="font-bold mb-2">DEBUG: EventNew</h4>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}
