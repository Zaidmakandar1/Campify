import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

export function UserDebugInfo() {
  const { user, userRole } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        setProfileData({ error: error.message });
      } else {
        setProfileData(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfileData({ error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  const createProfile = async (role: 'student' | 'faculty' | 'club') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || 'User',
          role: role
        });
      
      if (error) {
        toast.error('Failed to update profile');
        console.error(error);
      } else {
        toast.success('Profile updated! Please refresh the page.');
        fetchProfileData();
      }
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    }
  };

  if (!import.meta.env.DEV) return null; // Only show in development

  return (
    <Card className="mt-8 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">🐛 Debug Info (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div><strong>User Email:</strong> {user?.email || 'Not logged in'}</div>
          <div><strong>User ID:</strong> {user?.id || 'N/A'}</div>
          <div className="flex items-center gap-2">
            <strong>Current Role:</strong> 
            <Badge>
              {userRole === 'club' ? 'Club Representative' : 
               userRole === 'faculty' ? 'Faculty/Admin' : 
               userRole === 'student' ? 'Student' : 'None'}
            </Badge>
          </div>
          <div><strong>User Metadata:</strong> {JSON.stringify(user?.user_metadata || {})}</div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchProfileData} disabled={loading} size="sm">
            {loading ? 'Loading...' : 'Check Profile'}
          </Button>
          <Button onClick={() => createProfile('student')} size="sm" variant="outline">
            Set as Student
          </Button>
          <Button onClick={() => createProfile('club')} size="sm" variant="outline">
            Set as Club
          </Button>
          <Button onClick={() => createProfile('faculty')} size="sm" variant="outline">
            Set as Faculty
          </Button>
        </div>
        
        {profileData && (
          <div className="p-3 bg-white rounded border">
            <p><strong>Profile Data:</strong></p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}