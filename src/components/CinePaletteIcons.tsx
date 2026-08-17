import type { SVGProps } from 'react';

export type CineNavIconName = 'library' | 'match' | 'boards' | 'saved';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: CineNavIconName;
  active?: boolean;
}

export function CinePaletteMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        className="cine-mark__frame"
        d="M23.5 6.5h-10a7 7 0 0 0-7 7v5a7 7 0 0 0 7 7h10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        className="cine-mark__sample"
        x="22"
        y="13.75"
        width="4.5"
        height="4.5"
        rx="1"
        fill="#f29a7c"
      />
    </svg>
  );
}

export function CineNavIcon({ name, active = false, ...props }: IconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    'data-active': active ? '' : undefined,
    ...props,
  };

  if (name === 'library') {
    return (
      <svg {...common}>
        <rect x="4" y="7" width="13.5" height="12" rx="2.4" />
        <path d="M7 7V5.4A2.4 2.4 0 0 1 9.4 3H18a2 2 0 0 1 2 2v9.1a2.4 2.4 0 0 1-2.4 2.4h-.1" />
      </svg>
    );
  }

  if (name === 'match') {
    return (
      <svg {...common}>
        <path d="M9 4H6.5A2.5 2.5 0 0 0 4 6.5V9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15" />
        <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1.35" />
      </svg>
    );
  }

  if (name === 'boards') {
    return (
      <svg {...common}>
        <rect x="3.75" y="4.5" width="7" height="6" rx="1.5" />
        <rect x="13.25" y="4.5" width="7" height="6" rx="1.5" />
        <rect x="3.75" y="13" width="16.5" height="6.5" rx="1.75" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M7.25 5.5V4.75A2.25 2.25 0 0 1 9.5 2.5h7A2.25 2.25 0 0 1 18.75 4.75v11" />
      <path d="M5.25 7.5h10a2 2 0 0 1 2 2v12l-7-3.85-7 3.85v-12a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
