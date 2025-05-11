"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserConnections } from '@/services/socialMediaService';
import { PlatformID } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface OAuthContextProps {
  connectedPlatforms: PlatformID[];
  isLoadingConnections: boolean;
  isPlatformConnected: (platform: PlatformID) => boolean;
  refreshConnections: () => Promise<void>;
}

const OAuthContext = createContext<OAuthContextProps | undefined>(undefined);

export function OAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformID[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  useEffect(() => {
    if (user) {
      refreshConnections();
    } else {
      setConnectedPlatforms([]);
      setIsLoadingConnections(false);
    }
  }, [user]);

  const refreshConnections = async () => {
    if (!user) {
      setConnectedPlatforms([]);
      setIsLoadingConnections(false);
      return;
    }

    try {
      setIsLoadingConnections(true);
      const connections = await getUserConnections(user.uid);
      setConnectedPlatforms(connections.map(conn => conn.platform));
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to load your connected accounts.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const isPlatformConnected = (platform: PlatformID): boolean => {
    return connectedPlatforms.includes(platform);
  };

  return (
    <OAuthContext.Provider
      value={{
        connectedPlatforms,
        isLoadingConnections,
        isPlatformConnected,
        refreshConnections,
      }}
    >
      {children}
    </OAuthContext.Provider>
  );
}

export const useOAuth = () => {
  const context = useContext(OAuthContext);
  if (context === undefined) {
    throw new Error('useOAuth must be used within an OAuthProvider');
  }
  return context;
}; 