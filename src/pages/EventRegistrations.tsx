import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Download, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Registration {
  id: string;
  user_id: string;
  team_name: string | null;
  team_leader_name: string | null;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  team_members: TeamMember[];
}

interface TeamMember {
  member_name: string;
  member_email: string | null;
  member_phone: string | null;
  position: number;
}

export default function EventRegistrations() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, clubs(name, profile_id)')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

      // Check if user is the club owner
      if (eventData.clubs?.profile_id !== user?.id) {
        toast.error('Unauthorized access');
        return;
      }

      setEvent(eventData);

      // Fetch registrations with profiles
      const { data: regsData, error: regsError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (regsError) throw regsError;

      // Fetch profiles and team members for each registration
      const regsWithDetails = await Promise.all(
        (regsData || []).map(async (reg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', reg.user_id)
            .single();

          const { data: members } = await supabase
            .from('team_members')
            .select('*')
            .eq('registration_id', reg.id)
            .order('position');

          return {
            ...reg,
            profiles: profile,
            team_members: members || []
          };
        })
      );

      setRegistrations(regsWithDetails as Registration[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (registrations.length === 0) {
      toast.error('No registrations to download');
      return;
    }

    // Create CSV content
    let csv = 'Registration Date,User Name,User Email,Team Name,Team Leader,';
    
    // Add team member columns based on max team size
    const maxMembers = Math.max(...registrations.map(r => r.team_members.length), 0);
    for (let i = 1; i <= maxMembers; i++) {
      csv += `Member ${i} Name,Member ${i} Email,Member ${i} Phone,`;
    }
    csv += '\n';

    // Add data rows
    registrations.forEach(reg => {
      const date = new Date(reg.created_at).toLocaleString();
      const userName = reg.profiles?.full_name || 'N/A';
      const userEmail = reg.profiles?.email || 'N/A';
      const teamName = reg.team_name || 'N/A';
      const teamLeader = reg.team_leader_name || 'N/A';

      csv += `"${date}","${userName}","${userEmail}","${teamName}","${teamLeader}",`;

      // Add team members
      for (let i = 0; i < maxMembers; i++) {
        const member = reg.team_members[i];
        if (member) {
          csv += `"${member.member_name}","${member.member_email || 'N/A'}","${member.member_phone || 'N/A'}",`;
        } else {
          csv += '"","","",';
        }
      }
      csv += '\n';
    });

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title || 'event'}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/hub/event/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Link>
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-muted-foreground">
              {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={downloadCSV} disabled={registrations.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div className="space-y-4">
          {registrations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No registrations yet</p>
              </CardContent>
            </Card>
          ) : (
            registrations.map((reg, index) => (
              <Card key={reg.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Registration #{index + 1}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(reg.created_at).toLocaleString()}
                      </p>
                    </div>
                    {reg.team_name && (
                      <div className="text-right">
                        <p className="font-medium">{reg.team_name}</p>
                        <p className="text-sm text-muted-foreground">Team Name</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registered By</p>
                      <p className="font-medium">{reg.profiles?.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{reg.profiles?.email || 'N/A'}</p>
                    </div>
                    {reg.team_leader_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Team Leader</p>
                        <p className="font-medium">{reg.team_leader_name}</p>
                      </div>
                    )}
                  </div>

                  {reg.team_members.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        Team Members ({reg.team_members.length})
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {reg.team_members.map((member, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium">{member.member_name}</p>
                            {member.member_email && (
                              <p className="text-sm text-muted-foreground">{member.member_email}</p>
                            )}
                            {member.member_phone && (
                              <p className="text-sm text-muted-foreground">{member.member_phone}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
