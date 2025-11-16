import { GraduationCap } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto animate-pulse">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div className="absolute inset-0 h-16 w-16 rounded-xl border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gradient">Campify</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}