"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form as ShadcnForm, // Aliased import
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, UploadCloud, Settings2, Send, Tag, Film, ListChecks, AlertCircle } from "lucide-react";
import { PLATFORMS } from "@/config/platforms";
import type { PlatformID, ScheduledPost } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { postToPlatform } from "@/services/social-media"; // Mocked service
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { checkSubscriptionStatus, getSubscriptionErrorMessage } from "@/lib/subscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const formSchema = z.object({
  videoFile: z.any().refine(fileList => fileList && fileList.length > 0, "Video is required."),
  caption: z.string().min(1, "Caption is required.").max(2000, "Caption is too long."),
  hashtags: z.string().optional(),
  selectedPlatforms: z.array(z.custom<PlatformID>()).min(1, "Select at least one platform."),
  isScheduled: z.boolean().default(false),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
}).refine(data => {
  if (data.isScheduled) {
    return !!data.scheduledDate && !!data.scheduledTime;
  }
  return true;
}, {
  message: "Schedule date and time are required when scheduling is enabled.",
  path: ["isScheduled"],
});

type AIOFormValues = z.infer<typeof formSchema>;

const GlassCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={cn("bg-card/50 backdrop-blur-sm border border-[hsl(var(--border)/0.2)] rounded-xl p-6 shadow-lg", className)}>
    {children}
  </div>
);

export function AIOPostForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0); // In a real app, this would come from your backend
  
  const [initialScheduledDate, setInitialScheduledDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setInitialScheduledDate(tomorrow);
  }, []);

  // Mock connected platforms - in a real app, this would come from your backend
  const connectedPlatforms = ['instagram', 'twitter'];

  const subscriptionStatus = checkSubscriptionStatus(user, postCount);
  const subscriptionError = getSubscriptionErrorMessage(subscriptionStatus);

  const form = useForm<AIOFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: "",
      hashtags: "",
      selectedPlatforms: [],
      isScheduled: false,
      scheduledDate: undefined,
      scheduledTime: "10:00",
    },
  });

  useEffect(() => {
    if (initialScheduledDate && !form.getValues("scheduledDate")) {
      form.setValue("scheduledDate", initialScheduledDate);
    }
  }, [initialScheduledDate, form]);


  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
      setVideoFileName(file.name);
      form.setValue("videoFile", event.target.files);
    } else {
      setVideoPreview(null);
      setVideoFileName(null);
      form.setValue("videoFile", null);
    }
  };

  async function onSubmit(values: AIOFormValues) {
    // Check subscription status
    if (subscriptionStatus.hasExceededLimit) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade your plan to continue posting.",
        variant: "destructive",
      });
      return;
    }

    // Check platform connections
    const unconnectedPlatforms = values.selectedPlatforms.filter(
      platform => !connectedPlatforms.includes(platform)
    );

    if (unconnectedPlatforms.length > 0) {
      toast({
        title: "Platform Connection Required",
        description: `Please connect your ${unconnectedPlatforms.map(p => PLATFORMS.find(pl => pl.id === p)?.name).join(', ')} account(s) first.`,
        variant: "destructive",
      });
      return;
    }

    const postData: Partial<ScheduledPost> = {
      videoFileName: videoFileName || "video.mp4",
      caption: values.caption,
      hashtags: values.hashtags?.split(/\s*,\s*|\s+/).filter(Boolean) || [],
      platforms: values.selectedPlatforms,
    };

    if (values.isScheduled && values.scheduledDate && values.scheduledTime) {
      const [hours, minutes] = values.scheduledTime.split(":").map(Number);
      const scheduledDateTime = new Date(values.scheduledDate);
      scheduledDateTime.setHours(hours, minutes);
      postData.scheduledAt = scheduledDateTime;
      console.log("Scheduling post:", postData);
      toast({
        title: "Post Scheduled!",
        description: `Your post for ${postData.platforms.join(', ')} is scheduled for ${format(scheduledDateTime, "PPP p")}.`,
        variant: "default",
      });
    } else {
      postData.scheduledAt = new Date(); 
      console.log("Posting now:", postData);
      for (const platformId of values.selectedPlatforms) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (platform) {
          try {
            const response = await postToPlatform(platform, videoFileName || "video.mp4", values.caption, postData.hashtags || []);
            if(response.success) {
               toast({
                title: `Posted to ${platform.name}!`,
                description: response.message,
                variant: "default",
              });
            } else {
              toast({
                title: `Failed to post to ${platform.name}`,
                description: response.message,
                variant: "destructive",
              });
            }
          } catch (error) {
             toast({
                title: `Error posting to ${platform.name}`,
                description: error instanceof Error ? error.message : "An unknown error occurred.",
                variant: "destructive",
              });
          }
        }
      }
    }
    form.reset();
    setVideoPreview(null);
    setVideoFileName(null);
  }

  const isScheduled = form.watch("isScheduled");

  if (!initialScheduledDate) {
    return <div className="text-center p-8">Loading form...</div>;
  }

  return (
    <ShadcnForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {subscriptionError && (
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Required</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{subscriptionError}</span>
              <Button asChild variant="outline" size="sm">
                <Link href="/pricing">Upgrade Now</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <GlassCard>
          <FormField
            control={form.control}
            name="videoFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold flex items-center gap-2"><Film className="w-5 h-5 text-primary" />Video Upload</FormLabel>
                <FormControl>
                  <div className="mt-2 flex flex-col items-center justify-center w-full border-2 border-dashed border-[hsl(var(--border)/0.5)] rounded-lg p-8 cursor-pointer hover:border-primary transition-colors">
                    <UploadCloud className="w-12 h-12 text-muted-foreground mb-2" />
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="videoUploadInput"
                      disabled={subscriptionStatus.hasExceededLimit}
                    />
                    <label 
                      htmlFor="videoUploadInput" 
                      className={cn(
                        "text-primary font-medium cursor-pointer hover:underline",
                        subscriptionStatus.hasExceededLimit && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {videoFileName ? `Selected: ${videoFileName}` : "Choose video file or drag and drop"}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI supported. Max 1GB.</p>
                  </div>
                </FormControl>
                {videoPreview && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-[hsl(var(--border)/0.3)] shadow-md">
                    <video controls src={videoPreview} className="w-full aspect-video" data-ai-hint="video player screen" />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </GlassCard>

        <GlassCard>
          <FormField
            control={form.control}
            name="selectedPlatforms"
            render={({ field }) => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-lg font-semibold flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary" />Select Platforms</FormLabel>
                  <FormDescription className="text-sm">
                    Choose where you want to publish your content.
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {PLATFORMS.map((platform) => {
                    const isSelected = field.value?.includes(platform.id);
                    const isConnected = connectedPlatforms.includes(platform.id);
                    const platformLabelId = `platform-label-${platform.id}`;
                    
                    return (
                      <div 
                        key={platform.id}
                        className={cn(
                          "flex flex-col items-center space-y-2 p-4 rounded-lg border transition-all",
                          isSelected
                            ? `border-primary bg-[hsl(var(--primary)/0.1)] shadow-md`
                            : "border-[hsl(var(--border)/0.3)] hover:border-primary/70",
                          !isConnected && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (!isConnected) {
                            toast({
                              title: "Platform Not Connected",
                              description: `Please connect your ${platform.name} account first.`,
                              variant: "destructive",
                            });
                            return;
                          }
                          const currentValues = field.value || [];
                          const newValue = isSelected
                            ? currentValues.filter((id) => id !== platform.id)
                            : [...currentValues, platform.id];
                          field.onChange(newValue);
                        }}
                        role="checkbox" 
                        aria-checked={isSelected}
                        tabIndex={0} 
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            if (!isConnected) {
                              toast({
                                title: "Platform Not Connected",
                                description: `Please connect your ${platform.name} account first.`,
                                variant: "destructive",
                              });
                              return;
                            }
                            const currentValues = field.value || [];
                            const newValue = isSelected
                              ? currentValues.filter((id) => id !== platform.id)
                              : [...currentValues, platform.id];
                            field.onChange(newValue);
                          }
                        }}
                        aria-labelledby={platformLabelId}
                      >
                        <platform.Icon className={cn("w-8 h-8", isSelected ? platform.textColorClass : 'text-muted-foreground')} />
                        <span 
                          id={platformLabelId}
                          className={cn(
                            "text-sm font-medium text-center",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {platform.name}
                        </span>
                        {!isConnected && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs text-primary hover:text-primary/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              // In a real app, this would redirect to the platform's OAuth flow
                              window.location.href = `/connections`;
                            }}
                          >
                            Connect Account
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <FormMessage className="mt-2" />
              </FormItem>
            )}
          />
        </GlassCard>

        <GlassCard>
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Caption
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Craft your message..."
                    className="min-h-[120px] resize-none bg-input/50 border-[hsl(var(--border)/0.4)] focus:bg-input/70"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </GlassCard>

        <GlassCard>
          <FormField
            control={form.control}
            name="hashtags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold flex items-center gap-2"><Tag className="w-5 h-5 text-primary" />Hashtags</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. #SocialSync #ContentMagic #Tech"
                    className="bg-input/50 border-[hsl(var(--border)/0.4)] focus:bg-input/70"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Separate hashtags with spaces or commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </GlassCard>
        
        <GlassCard>
          <FormLabel className="text-lg font-semibold flex items-center gap-2 mb-4"><Settings2 className="w-5 h-5 text-primary" />Platform-Specific Settings</FormLabel>
          <div className="text-sm text-muted-foreground italic">
            Platform-specific options (e.g., Instagram Reels cover, YouTube thumbnail) will be available here based on selected platforms. (Feature coming soon)
            <Image src="https://picsum.photos/400/200" alt="Placeholder settings" width={400} height={200} className="mt-4 rounded-md opacity-50" data-ai-hint="settings ui interface"/>
          </div>
        </GlassCard>

        <GlassCard>
          <FormField
            control={form.control}
            name="isScheduled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[hsl(var(--border)/0.3)] p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Schedule Post
                  </FormLabel>
                  <FormDescription>
                    Enable to schedule this post for a future date and time.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Schedule post switch"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isScheduled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-input/50 border-[hsl(var(--border)/0.4)] hover:bg-input/70",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover/90 backdrop-blur-md" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} 
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        className="bg-input/50 border-[hsl(var(--border)/0.4)] focus:bg-input/70" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </GlassCard>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-gradient-to-r from-primary to-[hsl(var(--accent))] hover:opacity-90 text-primary-foreground shadow-lg px-8 py-3 text-base font-semibold rounded-lg transition-opacity"
          >
            {form.formState.isSubmitting ? "Submitting..." : (
              isScheduled ? (
                <><Clock className="mr-2 h-5 w-5" /> Schedule</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Post Now</>
              )
            )}
          </Button>
        </div>
      </form>
    </ShadcnForm>
  );
}

