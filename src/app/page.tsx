
"use client";

import { AIOPostForm } from "@/components/AIOPostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AIOPostPage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // No automatic redirect for home page if not logged in
    // Content will be conditional instead
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your awesome tools...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-10">
        <Card className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)] shadow-xl p-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Welcome to Socialync!
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              Streamline your social media management. Upload once, post everywhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Please log in or sign up to access the content creation tools and calendar.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-[hsl(var(--accent))] hover:opacity-90 text-primary-foreground">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)] shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Create New Post
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            You&apos;re logged in! Upload your video, craft your message, and share it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIOPostForm />
        </CardContent>
      </Card>
    </div>
  );
}
