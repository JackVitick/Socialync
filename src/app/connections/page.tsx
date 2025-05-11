"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { PLATFORMS } from "@/config/platforms";
import { AlertCircle, CheckCircle2, Link2, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getUserConnections, disconnectSocialMedia } from "@/services/socialMediaService";
import type { PlatformID } from "@/types";
import { FacebookAuthButton } from "@/components/FacebookAuthButton";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<PlatformID, boolean>>({} as any);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState<PlatformID | null>(null);
  const [isConnecting, setIsConnecting] = useState<PlatformID | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Handle success/error messages from OAuth redirects
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      const platform = success.split('_')[0];
      toast({
        title: "Connected Successfully",
        description: `Your ${platform} account has been connected.`,
      });
      
      // Clear URL parameters after showing toast
      router.replace('/connections');
      
      // Refresh connections data
      if (user) {
        loadUserConnections();
      }
    }

    if (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${error}`,
        variant: "destructive",
      });
      
      // Clear URL parameters after showing toast
      router.replace('/connections');
    }
  }, [searchParams, toast, user, router]);

  // Load connected platforms
  useEffect(() => {
    if (!user) return;
    loadUserConnections();
  }, [user]);

  // Load user connections from Firestore
  const loadUserConnections = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const connections = await getUserConnections(user.uid);
      
      // Initialize all platforms as disconnected
      const platformStatus: Record<PlatformID, boolean> = {} as any;
      PLATFORMS.forEach(p => {
        platformStatus[p.id] = false;
      });
      
      // Mark connected platforms
      connections.forEach(conn => {
        platformStatus[conn.platform] = true;
      });
      
      setConnectedPlatforms(platformStatus);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast({
        title: "Error",
        description: "Failed to load your connected accounts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to connect to a platform
  const handleConnect = (platform: PlatformID) => {
    // Facebook is handled by its own component
    if (platform === 'facebook') {
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect social media accounts.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set the connecting state for this platform
      setIsConnecting(platform);
      
      // Log for debugging
      console.log(`Connecting to ${platform}...`);
      console.log(`Redirect URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/auth/${platform}`);
      
      // Check if required environment variables are set
      const envVarMap = {
        instagram: ['INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET'],
        twitter: ['TWITTER_API_KEY', 'TWITTER_API_SECRET_KEY'],
        tiktok: ['TIKTOK_API_KEY', 'TIKTOK_APP_SECRET'],
        youtube: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
      };
      
      // Make sure the app URL is set
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.error('NEXT_PUBLIC_APP_URL is not defined!');
        toast({
          title: "Configuration Error",
          description: "The app URL is not properly configured. Please check your environment variables.",
          variant: "destructive",
        });
        setIsConnecting(null);
        return;
      }

      // Redirect to our OAuth endpoint
      window.location.href = `/api/auth/${platform}`;
    } catch (error) {
      console.error(`Error during ${platform} connection:`, error);
      toast({
        title: "Connection Error",
        description: `Error connecting to ${platform}. Please check your console for details.`,
        variant: "destructive",
      });
      setIsConnecting(null);
    }
  };

  // Function to disconnect a platform
  const handleDisconnect = async (platform: PlatformID) => {
    if (!user) return;

    try {
      setIsDisconnecting(platform);
      await disconnectSocialMedia(user.uid, platform);
      
      // Update state to reflect disconnection
      setConnectedPlatforms(prev => ({
        ...prev,
        [platform]: false
      }));
      
      toast({
        title: "Disconnected",
        description: `Your ${platform} account has been disconnected.`,
      });
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast({
        title: "Error",
        description: `Failed to disconnect your ${platform} account.`,
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(null);
    }
  };

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4">
            Connected Accounts
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect your social media accounts to enable cross-platform posting
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => loadUserConnections()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms[platform.id];
            const isPending = isConnecting === platform.id || isDisconnecting === platform.id;
            
            return (
              <Card key={platform.id} className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <platform.Icon className={`h-8 w-8 ${platform.textColorClass}`} />
                      <div>
                        <CardTitle>{platform.name}</CardTitle>
                        <CardDescription>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {/* Use FacebookAuthButton for Facebook, regular button for other platforms */}
                    {platform.id === 'facebook' ? (
                      <FacebookAuthButton 
                        isConnected={isConnected}
                        onSuccess={() => {
                          setConnectedPlatforms(prev => ({
                            ...prev,
                            [platform.id]: true
                          }));
                        }}
                        onError={(errorMsg) => {
                          toast({
                            title: "Connection Failed",
                            description: errorMsg,
                            variant: "destructive",
                          });
                        }}
                        onDisconnect={async () => {
                          await handleDisconnect(platform.id);
                        }}
                      />
                    ) : (
                      <Button
                        variant={isConnected ? "outline" : "default"}
                        className={isConnected ? "" : "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"}
                        onClick={() => isConnected ? handleDisconnect(platform.id) : handleConnect(platform.id)}
                        disabled={isPending}
                      >
                        {isConnecting === platform.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : isDisconnecting === platform.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : isConnected ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Link2 className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!isConnected && (
                    <Alert variant="destructive" className="bg-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Not Connected</AlertTitle>
                      <AlertDescription>
                        Connect your {platform.name} account to enable posting to this platform.
                      </AlertDescription>
                    </Alert>
                  )}
                  {isConnected && (
                    <Alert variant="default" className="bg-primary/10">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Connected</AlertTitle>
                      <AlertDescription>
                        Your {platform.name} account is connected. You can now post content to this platform.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 