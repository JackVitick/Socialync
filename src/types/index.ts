import type { LucideIcon } from 'lucide-react';
import type { SVGProps } from 'react';

export type PlatformID = "tiktok" | "instagram" | "facebook" | "twitter" | "youtube";

export interface Platform {
  id: PlatformID;
  name: string;
  Icon: LucideIcon | React.FC<SVGProps<SVGSVGElement>>;
  color: string; // CSS HSL string for platform color variable
  bgColorClass: string; // Tailwind class for background
  textColorClass: string; // Tailwind class for text
}

export interface ScheduledPost {
  id: string;
  videoUrl?: string; // URL of the uploaded video (or path to preview)
  videoFileName?: string;
  caption: string;
  hashtags: string[];
  platforms: PlatformID[];
  scheduledAt: Date;
  title?: string; // Optional title for calendar event
}
