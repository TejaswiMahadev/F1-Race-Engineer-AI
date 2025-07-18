interface RaceCarLogoProps {
  className?: string
  size?: number
}

export function RaceCarLogo({ className = "", size = 40 }: RaceCarLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Car body */}
        <path
          d="M15 45 L25 35 L75 35 L85 45 L85 65 L75 70 L25 70 L15 65 Z"
          fill="url(#carGradient)"
          stroke="#dc2626"
          strokeWidth="2"
        />

        {/* Front wing */}
        <path d="M75 45 L90 50 L88 55 L75 50 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />

        {/* Rear wing */}
        <path d="M25 45 L10 50 L12 55 L25 50 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />

        {/* Cockpit */}
        <ellipse cx="50" cy="50" rx="15" ry="8" fill="#1f2937" stroke="#374151" strokeWidth="1" />

        {/* Wheels */}
        <circle cx="25" cy="65" r="8" fill="#374151" stroke="#6b7280" strokeWidth="2" />
        <circle cx="75" cy="65" r="8" fill="#374151" stroke="#6b7280" strokeWidth="2" />
        <circle cx="25" cy="65" r="4" fill="#9ca3af" />
        <circle cx="75" cy="65" r="4" fill="#9ca3af" />

        {/* Speed lines */}
        <path d="M5 30 L20 32" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 40 L18 41" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 50 L15 51" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
      </svg>

      {/* Spark effect */}
      <div className="absolute -top-1 -right-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
            fill="#fbbf24"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  )
}
