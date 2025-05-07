"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2, BotMessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialSyncLogo } from '@/components/SocialSyncLogo'; // Component name can remain

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'AIO Post' },
    { href: '/calendar', label: 'Calendar' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border)/0.2)] bg-[hsl(var(--background)/0.8)] backdrop-blur-lg">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <SocialSyncLogo className="h-8 w-8 text-primary group-hover:text-[hsl(var(--primary)/0.8)] transition-colors" />
          <span className="text-2xl font-bold text-foreground group-hover:text-[hsl(var(--foreground)/0.8)] transition-colors">
            Socialync
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-foreground/70 hover:text-foreground transition-colors relative",
                pathname === link.href && "text-primary font-semibold after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:w-full after:bg-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
