"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2, User, LogIn, LogOut, UserPlus, LayoutDashboard, CalendarDays, Link2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialSyncLogo } from '@/components/SocialSyncLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const pathname = usePathname();
  const { user, signOutUser, loadingAuth } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home', Icon: LayoutDashboard },
    { href: '/dashboard', label: 'Dashboard', Icon: Share2 },
    { href: '/calendar', label: 'Calendar', Icon: CalendarDays },
  ];

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border)/0.2)] bg-[hsl(var(--background)/0.8)] backdrop-blur-lg shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <SocialSyncLogo className="h-8 w-8 text-primary group-hover:text-[hsl(var(--primary)/0.8)] transition-colors" />
          <span className="text-2xl font-bold text-gradient tracking-tight">
            Socialync
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-foreground/80 hover:text-foreground transition-colors relative flex items-center gap-2",
                  pathname === link.href && "text-primary font-semibold after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:w-full after:bg-primary after:rounded-full"
                )}
              >
                <link.Icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {loadingAuth ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-glow" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-primary">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/connections" className="flex items-center cursor-pointer">
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Connections</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="flex items-center cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Pricing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOutUser} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="font-medium">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button variant="default" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-medium rounded-xl shadow-sm">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
       {/* Mobile navigation - can be enhanced with a sheet component later */}
       <nav className="md:hidden flex items-center justify-around gap-2 text-sm font-medium p-2 border-t border-[hsl(var(--border)/0.2)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center text-foreground/70 hover:text-foreground transition-colors p-2 rounded-md",
                pathname === link.href && "text-primary bg-primary/10"
              )}
            >
              <link.Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{link.label}</span>
            </Link>
          ))}
        </nav>
    </header>
  );
}
