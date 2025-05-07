import type { SVGProps } from 'react';

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.5 5.5A3.5 3.5 0 0 0 13 2v11.5a4.5 4.5 0 1 0 9 0V9A4.5 4.5 0 0 0 17.5 4.5" />
      <path d="M9.5 15.5A3.5 3.5 0 0 0 6 12V2" />
    </svg>
  );
}
