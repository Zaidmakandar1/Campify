export function CampifyLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Circle Border - Navy Blue */}
      <circle
        cx="120"
        cy="120"
        r="115"
        fill="none"
        stroke="#1e5a7d"
        strokeWidth="8"
      />
      
      {/* White Ring */}
      <circle
        cx="120"
        cy="120"
        r="107"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
      />
      
      {/* Inner Circle Background - Teal Blue */}
      <circle
        cx="120"
        cy="120"
        r="100"
        fill="#2d6a8f"
      />
      
      {/* Bottom White Section for Text */}
      <path
        d="M 20 120 A 100 100 0 0 1 220 120 L 220 140 Q 220 220, 120 220 Q 20 220, 20 140 Z"
        fill="#f5f5f5"
      />
      
      {/* Open Book Base - Bottom Curve */}
      <ellipse cx="120" cy="125" rx="55" ry="8" fill="#1e5a7d" />
      
      {/* Open Book - Left Page */}
      <path
        d="M 65 125 Q 65 120, 70 115 L 70 70 Q 70 65, 75 65 L 115 65 Q 118 65, 120 68 L 120 125 Z"
        fill="#ffffff"
      />
      
      {/* Open Book - Right Page */}
      <path
        d="M 175 125 Q 175 120, 170 115 L 170 70 Q 170 65, 165 65 L 125 65 Q 122 65, 120 68 L 120 125 Z"
        fill="#ffffff"
      />
      
      {/* Book Pages - Left (Navy Blue) */}
      <path
        d="M 80 75 Q 80 72, 83 72 L 105 72 Q 108 72, 108 75 L 108 110 Q 108 113, 105 113 L 83 113 Q 80 113, 80 110 Z"
        fill="#2d6a8f"
      />
      
      {/* Book Pages - Right (Orange) */}
      <path
        d="M 132 75 Q 132 72, 135 72 L 157 72 Q 160 72, 160 75 L 160 110 Q 160 113, 157 113 L 135 113 Q 132 113, 132 110 Z"
        fill="#f5a623"
      />
      
      {/* Center Arrow Up - Orange */}
      <path
        d="M 120 45 L 135 68 L 128 68 L 128 90 L 112 90 L 112 68 L 105 68 Z"
        fill="#f5a623"
      />
      
      {/* Network Connection Dots */}
      <circle cx="85" cy="85" r="7" fill="#f5a623" />
      <circle cx="155" cy="85" r="7" fill="#f5a623" />
      <circle cx="120" cy="95" r="8" fill="#ffffff" stroke="#2d6a8f" strokeWidth="2" />
      <circle cx="175" cy="65" r="7" fill="#ffffff" stroke="#2d6a8f" strokeWidth="2" />
      <circle cx="65" cy="100" r="7" fill="#ffffff" stroke="#2d6a8f" strokeWidth="2" />
      
      {/* Connection Lines */}
      <line x1="85" y1="85" x2="120" y2="95" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <line x1="155" y1="85" x2="120" y2="95" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <line x1="120" y1="95" x2="175" y2="65" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <line x1="120" y1="95" x2="65" y2="100" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      
      {/* Campify Text - Navy Blue */}
      <text
        x="120"
        y="175"
        fontFamily="Arial, sans-serif"
        fontSize="38"
        fontWeight="700"
        fill="#1e5a7d"
        textAnchor="middle"
      >
        Campify
      </text>
    </svg>
  );
}