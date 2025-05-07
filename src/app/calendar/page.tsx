
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import type { ScheduledPost, PlatformID } from '@/types';
import { PLATFORMS } from '@/config/platforms';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock data - replace with actual data fetching (user-specific if applicable)
const MOCK_POSTS: ScheduledPost[] = [
  {
    id: '1',
    title: 'TikTok Fun',
    videoUrl: 'tiktok.mp4',
    caption: 'My new TikTok dance!',
    hashtags: ['#dance', '#tiktok'],
    platforms: ['tiktok'],
    scheduledAt: new Date(new Date().setDate(new Date().getDate() + 2)),
  },
  {
    id: '2',
    title: 'Insta Story Teaser',
    videoUrl: 'insta.mp4',
    caption: 'Behind the scenes...',
    hashtags: ['#bts', '#newproject'],
    platforms: ['instagram', 'facebook'],
    scheduledAt: new Date(new Date().setDate(new Date().getDate() + 5)),
  },
];

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
    if (user) { // Only fetch posts if user is authenticated
      // Simulate fetching data
      setTimeout(() => {
        setScheduledPosts(MOCK_POSTS);
        setIsLoadingPosts(false);
      }, 500);
    } else {
      // If no user, clear posts and set loading to false (or handle as needed)
      setScheduledPosts([]);
      setIsLoadingPosts(false);
    }
  }, [user]); // Rerun when user state changes


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
  
  if (loadingAuth || (!user && !loadingAuth)) { // Show loader if auth is loading or if user is null (and not loading, meaning redirect is imminent)
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
    <div className="space-y-8">
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="cursor-pointer hover:underline">{post.title || post.caption.substring(0,20)+'...'}</span>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 bg-popover/90 backdrop-blur-md p-4">
                        <h4 className="font-semibold mb-1">{post.title || 'Scheduled Post'}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{format(post.scheduledAt, 'PP p')}</p>
                        <p className="text-sm mb-2 truncate">{post.caption}</p>
                        <div className="flex flex-wrap gap-1">
                          {post.platforms.map(platformId => (
                            <span key={platformId} className={cn("px-1.5 py-0.5 rounded-full text-xs text-white", getPlatformColor(platformId))}>
                              {PLATFORMS.find(p => p.id === platformId)?.name}
                            </span>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Mobile Calendar List View */}
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
            components={{
              DayContent: ({ date }) => {
                if (!date) return <></>;
                const dailyPosts = postsForDay(date); 
                return (
                  <>
                    <span>{format(date, 'd')}</span>
                    {dailyPosts.length > 0 && (
                      <div className="flex justify-center mt-1">
                        {dailyPosts.slice(0,3).map(p => (
                           <div key={p.id} className={cn("w-1.5 h-1.5 rounded-full mx-px", getPlatformColor(p.platforms[0]))}></div>
                        ))}
                         {dailyPosts.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-muted mx-px"></div>}
                      </div>
                    )}
                  </>
                );
              },
            }}
          />
           {selectedDate && postsForDay(selectedDate).length > 0 && (
            <GlassCard className="p-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h3>
              <ul className="space-y-2">
                {postsForDay(selectedDate).map(post => (
                  <li key={post.id} className="p-3 rounded-md border border-[hsl(var(--border)/0.2)] bg-background/70">
                    <h4 className="font-semibold">{post.title || post.caption.substring(0,30)+'...'}</h4>
                    <p className="text-xs text-muted-foreground mb-1">{format(post.scheduledAt, 'p')}</p>
                    <div className="flex flex-wrap gap-1">
                      {post.platforms.map(platformId => (
                        <span key={platformId} className={cn("px-2 py-0.5 rounded-full text-xs text-white", getPlatformColor(platformId))}>
                          {PLATFORMS.find(p => p.id === platformId)?.name}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
          {selectedDate && postsForDay(selectedDate).length === 0 && (
             <GlassCard className="p-4 mt-4 text-center">
               <p className="text-muted-foreground">No posts scheduled for {format(selectedDate, 'MMMM d, yyyy')}.</p>
             </GlassCard>
          )}
        </div>
      </GlassCard>

      <Link href="/" passHref>
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-8 right-8 rounded-full p-4 h-16 w-16 shadow-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 text-primary-foreground"
          aria-label="Create new post"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </Link>
    </div>
  );
}
