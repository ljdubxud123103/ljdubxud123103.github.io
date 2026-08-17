import type { SVGProps } from 'react';

export type CineNavIconName = 'library' | 'match' | 'boards' | 'saved';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: CineNavIconName;
  active?: boolean;
}

export function CinePaletteMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22.5 6H11a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h11.5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M20.5 10h5" stroke="#f29a7c" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M20.5 16h5" stroke="#d7a857" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M20.5 22h5" stroke="#58aaa0" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function CineNavIcon({ name, active = false, ...props }: IconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };

  if (name === 'library') {
    return (
      <svg {...common}>
        <rect
          x="3.25"
          y="4.75"
          width="17.5"
          height="14.5"
          rx="3"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.1 : 0}
        />
        <path d="M7.25 4.75v14.5M16.75 4.75v14.5" />
        <rect x="8.75" y="8" width="6.5" height="8" rx="1.35" />
        <path d="M4.25 8.5h3M4.25 15.5h3M16.75 8.5h3M16.75 15.5h3" />
      </svg>
    );
  }

  if (name === 'match') {
    return (
      <svg {...common}>
        <path d="M9 4H6a2 2 0 0 0-2 2v3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" />
        <circle
          cx="12"
          cy="8.4"
          r="2.25"
          fill={active ? '#f29a7c' : 'none'}
          stroke={active ? '#f29a7c' : 'currentColor'}
        />
        <circle
          cx="8.7"
          cy="14.25"
          r="2.25"
          fill={active ? '#d7a857' : 'none'}
          stroke={active ? '#d7a857' : 'currentColor'}
        />
        <circle
          cx="15.3"
          cy="14.25"
          r="2.25"
          fill={active ? '#58aaa0' : 'none'}
          stroke={active ? '#58aaa0' : 'currentColor'}
        />
        <path d="m10.9 10.35-1.1 1.95M13.1 10.35l1.1 1.95M10.95 14.25h2.1" />
      </svg>
    );
  }

  if (name === 'boards') {
    return (
      <svg {...common}>
        <rect
          x="3.5"
          y="4.5"
          width="17"
          height="15"
          rx="3"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.08 : 0}
        />
        <path d="M3.5 11.5h17M10.5 4.5v7M15 11.5v8" />
        {active && <rect x="5.5" y="6.5" width="3" height="3" rx="0.8" fill="currentColor" stroke="none" />}
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        d="M7 4.25h10a2 2 0 0 1 2 2v13.5l-7-3.85-7 3.85V6.25a2 2 0 0 1 2-2Z"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.1 : 0}
      />
      <path d="M8.75 8.25h6.5M8.75 11.75h6.5" />
      {active && <circle cx="12" cy="14.4" r="1.15" fill="currentColor" stroke="none" />}
    </svg>
  );
}
