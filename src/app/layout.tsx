"use client";

import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { OAuthProvider } from '@/contexts/OAuthContext';
import { ToastProvider } from '@/components/ui/toast';
import { Header } from '@/components/layout/Header';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState } from 'react';

// Load the Inter font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

// Create a client
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
        <title>Socialync - Cross-Platform Social Media Management</title>
        <meta name="description" content="Manage and post to all your social media accounts from one place" />
      </head>
      <body className={`min-h-screen bg-gradient-to-r from-gray-950 via-slate-950 to-cyan-950 font-sans antialiased`}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <OAuthProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1 pb-12">{children}</main>
                </div>
              </OAuthProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
