export const StarIcon = ({ on = true, size }: { on?: boolean; size?: number }) => (
  <svg className={`star-icon${on ? ' on' : ''}`} viewBox="0 0 60 58" width={size} height={size} aria-hidden="true">
    <path d="M30 4l7.6 16.2 17.7 2.1-13 12.2 3.4 17.5L30 43.4 14.3 52l3.4-17.5-13-12.2 17.7-2.1z" />
  </svg>
);

export const BackIcon = () => (
  <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const SpeakerIcon = ({ muted = false }: { muted?: boolean }) => (
  <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9z" />
    {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
  </svg>
);

export const MouthIcon = ({ muted = false }: { muted?: boolean }) => (
  <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5h16v11H9l-5 4z" />
    {muted ? <path d="M9 8l6 5M15 8l-6 5" /> : <path d="M8 9h8M8 12.5h5" />}
  </svg>
);

export const ArrowIcon = () => (
  <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
