import type { Platform } from '@/types';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';

export const PLATFORMS: Platform[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    Icon: TikTokIcon,
    color: 'hsl(var(--platform-tiktok))',
    bgColorClass: 'bg-[hsl(var(--platform-tiktok))]',
    textColorClass: 'text-[hsl(var(--platform-tiktok))]',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    Icon: Instagram,
    color: 'hsl(var(--platform-instagram))',
    bgColorClass: 'bg-[hsl(var(--platform-instagram))]',
    textColorClass: 'text-[hsl(var(--platform-instagram))]',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    Icon: Facebook,
    color: 'hsl(var(--platform-facebook))',
    bgColorClass: 'bg-[hsl(var(--platform-facebook))]',
    textColorClass: 'text-[hsl(var(--platform-facebook))]',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    Icon: Twitter,
    color: 'hsl(var(--platform-twitter))',
    bgColorClass: 'bg-[hsl(var(--platform-twitter))]',
    textColorClass: 'text-[hsl(var(--platform-twitter))]',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    Icon: Youtube,
    color: 'hsl(var(--platform-youtube))',
    bgColorClass: 'bg-[hsl(var(--platform-youtube))]',
    textColorClass: 'text-[hsl(var(--platform-youtube))]',
  },
];
