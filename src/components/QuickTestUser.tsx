import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function QuickTestUser() {
  const [creating, setCreating] = useState(false);
  const { signUp } = useAuth();

  const createTestUser = async (role: 'student' | 'faculty' | 'club') => {
    setCreating(true);
    const timestamp = Date.now();
    const testEmail = `test-${role}-${timestamp}@campify.test`;
    const testPassword = 'test123456';
    
    try {
      await signUp(testEmail, testPassword, `Test ${role}`, role);
      toast.success(`Test ${role} account created!`);
    } catch (error) {
      console.error('Test user creation failed:', error);
    }
    setCreating(false);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🧪 Quick Test Users (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => createTestUser('student')} 
            disabled={creating}
            size="sm"
            variant="outline"
          >
            Create Test Student
          </Button>
          <Button 
            onClick={() => createTestUser('club')} 
            disabled={creating}
            size="sm"
            variant="outline"
          >
            Create Test Club Rep
          </Button>
          <Button 
            onClick={() => createTestUser('faculty')} 
            disabled={creating}
            size="sm"
            variant="outline"
          >
            Create Test Faculty
          </Button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Password for all test users: test123456
        </p>
      </CardContent>
    </Card>
  );
}