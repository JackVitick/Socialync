"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Facebook } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookAuthButton({ 
  onSuccess, 
  onError,
  isConnected = false,
  onDisconnect
}: { 
  onSuccess: () => void; 
  onError: (error: string) => void;
  isConnected?: boolean;
  onDisconnect?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFacebookLogin = () => {
    if (!user) {
      onError('You must be logged in to connect Facebook');
      return;
    }

    // For now, just use the standard OAuth flow which works without HTTPS
    window.location.href = `/api/auth/facebook`;
  };

  const handleDisconnect = () => {
    if (!onDisconnect) return;
    
    setIsLoading(true);
    
    // Call the disconnect handler
    onDisconnect()
      .then(() => {
        toast({
          title: "Facebook Disconnected",
          description: "Your Facebook account has been disconnected.",
        });
      })
      .catch(error => {
        console.error('Facebook disconnect error:', error);
        onError(error instanceof Error ? error.message : 'Failed to disconnect Facebook');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Button
      onClick={isConnected ? handleDisconnect : handleFacebookLogin}
      disabled={isLoading}
      variant={isConnected ? "outline" : "default"}
      className={isConnected ? "" : "bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isConnected ? 'Disconnecting...' : 'Connecting...'}
        </>
      ) : (
        <>
          <Facebook className="mr-2 h-4 w-4" />
          {isConnected ? 'Disconnect' : 'Connect with Facebook'}
        </>
      )}
    </Button>
  );
} 