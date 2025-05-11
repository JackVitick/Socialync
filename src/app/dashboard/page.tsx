"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SocialMediaPost } from "@/components/SocialMediaPost";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  // Redirect to login if user is not authenticated
  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4">
          Social Dashboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage and post to all your social accounts from one place
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <SocialMediaPost />
        </div>

        <div className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)] rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Need to connect more accounts?</h2>
          <p className="text-muted-foreground mb-4">
            Visit the connections page to add more social media accounts to your dashboard.
          </p>
          <Link href="/connections">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Connections
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 