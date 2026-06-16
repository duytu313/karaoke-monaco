export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Monaco M Logo */}
      <path
        d="M50 10L20 35V85L50 110L80 85V35L50 10Z"
        stroke="#D4AF37"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M50 25L30 42V78L50 95L70 78V42L50 25Z"
        stroke="#D4AF37"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M50 10L50 25M20 35L30 42M80 35L70 42M20 85L30 78M80 85L70 78M50 110L50 95"
        stroke="#D4AF37"
        strokeWidth="2"
      />
      <path
        d="M30 42L50 55L70 42"
        stroke="#D4AF37"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M50 55V95"
        stroke="#D4AF37"
        strokeWidth="2"
      />
    </svg>
  )
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Logo className="w-24 h-28" />
      <div className="mt-4 text-center">
        <h1 className="text-2xl font-bold tracking-[0.3em] text-[#D4AF37]">
          MONACO
        </h1>
        <p className="text-sm tracking-[0.4em] text-[#D4AF37] mt-1">
          KARAOKE
        </p>
      </div>
    </div>
  )
}
