import React from 'react';

interface RiskCartLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const RiskCartLogo: React.FC<RiskCartLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const shieldDimension = isSm ? 'w-8 h-8' : isLg ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = isSm ? 'text-xs' : isLg ? 'text-lg' : 'text-sm';
  const subtitleSize = isSm ? 'text-[9px]' : isLg ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official RiskCart Cyber Shield with POS */}
      <div className={`relative ${shieldDimension} shrink-0 group`}>
        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl group-hover:bg-blue-500/40 transition-all" />
        <svg
          viewBox="0 0 100 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Shield Outline Outer */}
          <path
            d="M50 4 L88 18 C88 56 68 88 50 102 C32 88 12 56 12 18 Z"
            fill="url(#shieldGrad)"
            stroke="url(#borderGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Shield Accent */}
          <path
            d="M50 12 L80 23 C80 54 63 80 50 92 C37 80 20 54 20 23 Z"
            fill="#091226"
            fillOpacity="0.85"
            stroke="#60a5fa"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Bold POS Typography */}
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="30"
            letterSpacing="1.5"
          >
            POS
          </text>

          {/* Micro AI Chip Indicator Dot */}
          <circle cx="50" cy="80" r="3.5" fill="#38bdf8" />
          <line x1="38" y1="80" x2="44" y2="80" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="56" y1="80" x2="62" y2="80" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Vertical Brand Divider */}
      <div className="h-7 w-[1.5px] bg-gradient-to-b from-transparent via-blue-500/60 to-transparent shrink-0" />

      {/* Brand Typography */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-black text-white tracking-tight ${titleSize} leading-tight`}>
            RiskCart
          </span>
          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/40 uppercase tracking-wider">
            AI
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-slate-400 font-semibold tracking-wide truncate ${subtitleSize} leading-tight -mt-0.5`}>
            Artificial Intelligence
          </span>
        )}
      </div>
    </div>
  );
};
