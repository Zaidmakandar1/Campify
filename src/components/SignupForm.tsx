import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SignupFormProps {
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function SignupForm({ isLoading, onSubmit }: SignupFormProps) {
  const [selectedRole, setSelectedRole] = useState('student');

  return (
    <form onSubmit={onSubmit}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full Name</Label>
          <Input
            id="signup-name"
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            placeholder="your.email@university.edu"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            required
            minLength={6}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">I am a...</Label>
          <Select 
            name="role" 
            required 
            defaultValue="student"
            onValueChange={setSelectedRole}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty/Admin</SelectItem>
              <SelectItem value="club">Club Representative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Club-specific fields */}
        {selectedRole === 'club' && (
          <>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Club Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  name="clubName"
                  type="text"
                  placeholder="Computer Science Club"
                  required={selectedRole === 'club'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="club-description">Club Description</Label>
                <Textarea
                  id="club-description"
                  name="clubDescription"
                  placeholder="Brief description of your club's mission and activities..."
                  rows={3}
                  className="resize-none"
                  required={selectedRole === 'club'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="club-category">Club Category</Label>
                <Select name="clubCategory" required={selectedRole === 'club'}>
                  <SelectTrigger id="club-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="arts">Arts & Creative</SelectItem>
                    <SelectItem value="service">Community Service</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Faculty-specific note */}
        {selectedRole === 'faculty' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Faculty/Admin Access:</strong> You'll have access to review feedback, 
              generate reports, and manage platform settings.
            </p>
          </div>
        )}

        {/* Student note */}
        {selectedRole === 'student' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Student Access:</strong> You can submit feedback, register for events, 
              and explore club activities.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </CardFooter>
    </form>
  );
}