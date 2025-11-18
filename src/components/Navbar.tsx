import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CampifyLogo } from '@/components/CampifyLogo';
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b navbar-blur sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform" key="navbar-logo-v3">
          <div className="flex-shrink-0">
            <CampifyLogo className="h-12 w-12" />
          </div>
          <span className="font-bold text-xl text-white drop-shadow-md">
            Campify
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild className="text-white hover:bg-white/20 hover:text-white">
                <Link to="/voice">The Voice</Link>
              </Button>
              <Button variant="ghost" asChild className="text-white hover:bg-white/20 hover:text-white">
                <Link to="/hub">The Hub</Link>
              </Button>
              <Button variant="ghost" asChild className="text-white hover:bg-white/20 hover:text-white">
                <Link to="/market">The Market</Link>
              </Button>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                    <Avatar className="h-8 w-8 ring-2 ring-white/50">
                      <AvatarFallback className="bg-accent text-white font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    console.log('[Navbar] Sign out clicked');
                    try {
                      await signOut();
                    } catch (error) {
                      console.error('[Navbar] Sign out error:', error);
                    }
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="bg-white text-primary hover:bg-white/90 shadow-lg font-semibold">
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
