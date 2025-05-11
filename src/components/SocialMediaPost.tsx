"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useOAuth } from "@/contexts/OAuthContext";
import { PLATFORMS } from "@/config/platforms";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, ImagePlus, Calendar } from "lucide-react";
import { postToMultiplePlatforms } from "@/services/socialMediaService";
import type { PlatformID } from "@/types";
import { Switch } from "@/components/ui/switch";

export function SocialMediaPost() {
  const { user } = useAuth();
  const { connectedPlatforms, isLoadingConnections } = useOAuth();
  
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformID[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isLongFormVideo, setIsLongFormVideo] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check if YouTube is selected
  const isYouTubeSelected = selectedPlatforms.includes('youtube');

  // Filter available platforms based on media type
  const getAvailablePlatforms = () => {
    if (!mediaType) return PLATFORMS;
    if (mediaType === "image") {
      // TikTok doesn't support static images
      return PLATFORMS.filter(p => p.id !== 'tiktok');
    }
    return PLATFORMS;
  };

  const handlePlatformToggle = (platform: PlatformID) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);

    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('image');
      // If switching from video to image, remove TikTok if selected
      setSelectedPlatforms(prev => prev.filter(p => p !== 'tiktok'));
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      
      // Detect if it's a long-form video (could be based on duration, but using file size as proxy here)
      const isLongForm = file.size > 20 * 1024 * 1024; // Arbitrary threshold (20MB)
      setIsLongFormVideo(isLongForm);
    }

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScheduleToggle = (checked: boolean) => {
    setScheduleMode(checked);
    if (checked && !scheduledDate) {
      // Set default scheduled date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduledDate(tomorrow);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const [date, time] = dateValue.split('T');
      const scheduled = new Date(`${date}T${time || '09:00'}`);
      setScheduledDate(scheduled);
    } else {
      setScheduledDate(null);
    }
  };

  const handlePost = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post to social media.",
        variant: "destructive",
      });
      return;
    }

    if (!mediaFile) {
      toast({
        title: "Media Required",
        description: "Please upload an image or video for your post.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select Platforms",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }

    if (isYouTubeSelected && isLongFormVideo && !title) {
      toast({
        title: "Title Required",
        description: "Please add a title for your YouTube video.",
        variant: "destructive",
      });
      return;
    }

    if (!text) {
      toast({
        title: "Caption Required",
        description: "Please add a caption for your post.",
        variant: "destructive",
      });
      return;
    }

    if (scheduleMode && !scheduledDate) {
      toast({
        title: "Schedule Time Required",
        description: "Please select when you want to schedule your post.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // In a real app, you would upload the media file to your server/cloud storage first
      // and then use the URL in the post
      let mediaUrls: string[] = [];
      if (mediaFile) {
        // This is a mock implementation - in a real app you would upload the file
        // and get back the URL
        console.log("Uploading media:", mediaFile.name);
        mediaUrls = ["https://example.com/media/1234.jpg"]; // Mock URL
      }

      // Parse hashtags
      const hashtagArray = hashtags
        .split(/[ ,#]+/)
        .filter(Boolean)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

      // Post to selected platforms
      const result = await postToMultiplePlatforms(user.uid, selectedPlatforms, {
        text,
        mediaUrls,
        hashtags: hashtagArray,
      });

      // Check results
      const failures = Object.entries(result)
        .filter(([_, { success }]) => !success)
        .map(([platform]) => platform);

      if (failures.length === 0) {
        toast({
          title: scheduleMode ? "Scheduled Successfully" : "Posted Successfully",
          description: scheduleMode 
            ? `Your post has been scheduled for ${scheduledDate?.toLocaleString()}` 
            : `Your post has been shared to ${selectedPlatforms.length} platform(s).`,
        });

        // Reset form
        setText("");
        setTitle("");
        setHashtags("");
        setSelectedPlatforms([]);
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        setIsLongFormVideo(false);
      } else {
        toast({
          title: "Partial Success",
          description: `Failed to post to: ${failures.join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error posting:", error);
      toast({
        title: "Error",
        description: "Failed to publish your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Create a Post</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="schedule-mode" className="text-sm">
              {scheduleMode ? "Schedule" : "Post Now"}
            </Label>
            <Switch
              id="schedule-mode"
              checked={scheduleMode}
              onCheckedChange={handleScheduleToggle}
            />
            <Calendar className="h-4 w-4 ml-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Media upload - first section */}
        <div className="space-y-2">
          <Label className="block mb-2">Upload Media</Label>
          <div className="flex flex-col items-center gap-4 w-full border-2 border-dashed rounded-lg p-6 border-muted-foreground/25 hover:border-primary/50 transition-colors">
            {!mediaPreview ? (
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  className="flex items-center gap-2 mb-2"
                  disabled={isLoading}
                >
                  <ImagePlus className="h-4 w-4" />
                  Select Image or Video
                </Button>
                <p className="text-sm text-muted-foreground">Upload your media first to continue</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative max-w-lg max-h-64 rounded overflow-hidden mb-3">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaPreview}
                      alt="Media preview"
                      className="object-contain max-h-64 rounded"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="max-h-64 rounded"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {mediaType === 'image' ? 'Image' : (isLongFormVideo ? 'Long-form video' : 'Short-form video')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <ImagePlus className="h-4 w-4" />
                  Change Media
                </Button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Platform selection */}
        <div className="space-y-2">
          <Label className="block mb-2">Select Platforms</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isLoadingConnections ? (
              <div className="col-span-full flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : connectedPlatforms.length === 0 ? (
              <div className="col-span-full">
                <p className="text-sm text-muted-foreground">
                  No connected platforms. Connect accounts in the Connections page.
                </p>
              </div>
            ) : (
              getAvailablePlatforms()
                .filter(p => connectedPlatforms.includes(p.id))
                .map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform.id}`}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                      disabled={isLoading || (mediaType === "image" && platform.id === "tiktok")}
                    />
                    <Label
                      htmlFor={`platform-${platform.id}`}
                      className={`flex items-center cursor-pointer ${mediaType === "image" && platform.id === "tiktok" ? "opacity-50" : ""}`}
                    >
                      <platform.Icon className={`h-4 w-4 mr-2 ${platform.textColorClass}`} />
                      {platform.name}
                      {mediaType === "image" && platform.id === "tiktok" && " (requires video)"}
                    </Label>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Title - Only for YouTube long-form videos */}
        {isYouTubeSelected && isLongFormVideo && (
          <div className="space-y-2">
            <Label htmlFor="video-title">Title (for YouTube)</Label>
            <Input
              id="video-title"
              placeholder="Enter video title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        )}

        {/* Caption/Description */}
        <div className="space-y-2">
          <Label htmlFor="post-text">Caption</Label>
          <Textarea
            id="post-text"
            placeholder="Write your caption here..."
            className="min-h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label htmlFor="hashtags">Hashtags</Label>
          <Input
            id="hashtags"
            placeholder="Enter hashtags (separated by spaces)"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            disabled={isLoading}
          />
          {hashtags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hashtags
                .split(/[ ,#]+/)
                .filter(Boolean)
                .map((tag, index) => (
                  <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Schedule datetime if in schedule mode */}
        {scheduleMode && (
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Schedule Date & Time</Label>
            <Input
              id="schedule-date"
              type="datetime-local"
              value={scheduledDate ? scheduledDate.toISOString().slice(0, 16) : ''}
              onChange={handleDateChange}
              min={new Date().toISOString().slice(0, 16)}
              disabled={isLoading}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
          onClick={handlePost}
          disabled={isLoading || !mediaFile || selectedPlatforms.length === 0 || !text || (scheduleMode && !scheduledDate)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {scheduleMode ? "Scheduling..." : "Posting..."}
            </>
          ) : (
            <>
              {scheduleMode ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Post Now
                </>
              )}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 