import { useId } from "react";

type Props = {
  className?: string;
};

export function RemoteCursorIcon({ className }: Props) {
  const uid = useId().replace(/:/g, "");
  const gradId = `rc-grad-${uid}`;
  const glowId = `rc-glow-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="6"
          y1="8"
          x2="28"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={`hsl(#000, 95%, 62%)`} />
          <stop offset="1" stopColor={`hsl(#000, 100%, 48%)`} />
        </linearGradient>
        <filter
          id={glowId}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        filter={`url(#${glowId})`}
        d="M5 5v22l7-6.5 5.5 11 4-2-5.5-10.5H27L5 5Z"
        fill={`url(#${gradId})`}
        stroke="white"
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M8.5 10.5 14 16.2V14l9.2 9.2"
        stroke="white"
        strokeOpacity={0.35}
        strokeWidth={1.25}
        strokeLinecap="round"
      />
      <circle cx={5.5} cy={5.5} r={1.85} fill="white" />
    </svg>
  );
}
