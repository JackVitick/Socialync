"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Sparkles, Clock } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const { user } = useAuth();

  return (
    <div className="container max-w-5xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground">
          Start with 5 free posts, then upgrade to unlock unlimited posting
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Tier */}
        <Card className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)]">
          <CardHeader>
            <CardTitle className="text-2xl">Free Trial</CardTitle>
            <CardDescription>Perfect for trying out Socialync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$0</div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>5 free posts</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>All social platforms</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Basic scheduling</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href={user ? "/dashboard" : "/signup"}>
                {user ? "Use Free Plan" : "Get Started"}
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Tier */}
        <Card className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)] relative md:scale-105 z-10 shadow-xl">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro Plan</CardTitle>
            <CardDescription>For serious content creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$3<span className="text-lg font-normal text-muted-foreground">/month</span></div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span><strong>Unlimited</strong> posts</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>All social platforms</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Advanced scheduling</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Priority support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
              <Link href={user ? "/api/stripe/checkout" : "/signup"}>
                {user ? "Upgrade Now" : "Get Started"}
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* AI Tier (Coming Soon) */}
        <Card className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)] relative opacity-85">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
            Coming Soon
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              AI Creator
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </CardTitle>
            <CardDescription>AI-powered content optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$10<span className="text-lg font-normal text-muted-foreground">/month</span></div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Everything in Pro plan</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>AI-generated captions</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Platform-specific optimization</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Video transcript analysis</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                <span>Growth analytics</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              <Clock className="mr-2 h-4 w-4" /> Coming Soon
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 