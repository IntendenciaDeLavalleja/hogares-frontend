export default function HouseO({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 150 100"
      className={`hero-house ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="102"
        y="10"
        width="15"
        height="30"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        d="M16 49h118v47H16z"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 51 75 7l71 44Z"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="75" cy="70" r="15" fill="currentColor" />
    </svg>
  );
}
