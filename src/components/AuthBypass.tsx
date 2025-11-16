import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface AuthBypassProps {
  onBypass: (role: 'student' | 'faculty' | 'club') => void;
}

export function AuthBypass({ onBypass }: AuthBypassProps) {
  const [bypassing, setBypassing] = useState(false);

  const handleBypass = (role: 'student' | 'faculty' | 'club') => {
    setBypassing(true);
    setTimeout(() => {
      onBypass(role);
      setBypassing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="max-w-md w-full border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Authentication Issue</CardTitle>
          </div>
          <CardDescription>
            Auth is taking too long. Choose a role to continue testing:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button 
              onClick={() => handleBypass('student')} 
              disabled={bypassing}
              variant="outline"
              className="w-full"
            >
              Continue as Student
            </Button>
            <Button 
              onClick={() => handleBypass('club')} 
              disabled={bypassing}
              variant="outline"
              className="w-full"
            >
              Continue as Club Representative
            </Button>
            <Button 
              onClick={() => handleBypass('faculty')} 
              disabled={bypassing}
              variant="outline"
              className="w-full"
            >
              Continue as Faculty/Admin
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This is a temporary bypass for development. Fix auth issues in production.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}