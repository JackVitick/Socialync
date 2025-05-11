"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Loader2, ClipboardList } from 'lucide-react';
import type { ScheduledPost, PlatformID } from '@/types';
import { PLATFORMS } from '@/config/platforms';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const GlassCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={cn("bg-card/60 backdrop-blur-md border border-[hsl(var(--border)/0.3)] rounded-xl shadow-xl", className)}>
    {children}
  </div>
);

export default function CalendarPage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  
  // Client-side only date initialization
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login?redirect=/calendar');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (user) {
      // In a real implementation, you would fetch the user's scheduled posts here
      // For now, we'll just set an empty array and turn off loading
      setScheduledPosts([]);
      setIsLoadingPosts(false);
    } else {
      setScheduledPosts([]);
      setIsLoadingPosts(false);
    }
  }, [user]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const postsForDay = (day: Date) => {
    return scheduledPosts.filter(post => isSameDay(post.scheduledAt, day));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date);
    if (date) {
      setCurrentMonth(date); 
    }
  };

  const getPlatformColor = (platformId: PlatformID) => {
    return PLATFORMS.find(p => p.id === platformId)?.bgColorClass || 'bg-muted';
  };
  
  if (loadingAuth || (!user && !loadingAuth)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          {loadingAuth ? "Checking your credentials..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  if (isLoadingPosts || typeof selectedDate === 'undefined') {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your calendar...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4 sm:mb-0">
            Content Calendar
          </h1>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-background/70 hover:bg-accent/20 border-primary/50 text-primary">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover/90 backdrop-blur-md" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-medium w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden md:grid grid-cols-7 gap-px border-l border-t border-[hsl(var(--border)/0.2)] bg-[hsl(var(--border)/0.1)] rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center font-medium text-muted-foreground text-sm bg-background/30 border-r border-b border-[hsl(var(--border)/0.2)]">{day}</div>
          ))}
          {daysInMonth.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "p-2 min-h-[120px] border-r border-b border-[hsl(var(--border)/0.2)] transition-colors relative cursor-pointer",
                isSameMonth(day, currentMonth) ? 'bg-background/50 hover:bg-background/80' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30',
                isSameDay(day, new Date()) && 'bg-accent/10',
                isSameDay(day, selectedDate || new Date(0)) && 'ring-2 ring-primary ring-inset' 
              )}
              onClick={() => handleDateSelect(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleDateSelect(day)}
              aria-label={`Select date ${format(day, 'PPP')}`}
            >
              <span className={cn("absolute top-2 right-2 text-sm font-medium", isSameMonth(day, currentMonth) ? "text-foreground" : "text-muted-foreground/70")}>
                {format(day, 'd')}
              </span>
              <div className="mt-6 space-y-1">
                {postsForDay(day).map(post => (
                  <div key={post.id} className="p-1.5 rounded text-xs text-white truncate bg-opacity-80 shadow" style={{backgroundColor: PLATFORMS.find(p=>p.id === post.platforms[0])?.color || 'gray'}}>
                    {post.title || post.caption.substring(0,20)+'...'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Calendar View */}
        <div className="md:hidden space-y-4 mt-4">
           <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border border-[hsl(var(--border)/0.2)] bg-background/50 p-0"
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
              day_today: "bg-accent text-accent-foreground",
              caption_label: "text-lg",
            }}
          />
        </div>
      </GlassCard>

      {/* Empty state or day detail view */}
      {scheduledPosts.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-medium mb-2">No scheduled posts yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your scheduled posts will appear here. Create posts from the dashboard and set a schedule date to see them on your calendar.
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
              <Link href="/dashboard">
                <Plus className="h-4 w-4 mr-2" /> Create a Post
              </Link>
            </Button>
          </div>
        </GlassCard>
      ) : selectedDate && postsForDay(selectedDate).length > 0 ? (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">{format(selectedDate, 'MMMM d, yyyy')}</h3>
          <div className="space-y-4">
            {postsForDay(selectedDate).map(post => (
              <Card key={post.id} className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{post.title || 'Scheduled Post'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">{format(post.scheduledAt, 'p')}</p>
                  <p className="mb-2">{post.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {post.platforms.map(platformId => (
                      <span key={platformId} className={cn("px-2 py-1 rounded-full text-xs text-white", getPlatformColor(platformId))}>
                        {PLATFORMS.find(p => p.id === platformId)?.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 text-center">
          <p className="text-muted-foreground py-4">
            No posts scheduled for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </GlassCard>
      )}
    </div>
  );
}
