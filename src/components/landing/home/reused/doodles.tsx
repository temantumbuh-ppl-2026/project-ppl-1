// Doodle SVG dekoratif dari desain landing page.

export function DoodleArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`doodle-arrow ${className}`}
      viewBox="0 0 120 80"
      aria-hidden="true"
    >
      <path
        pathLength={100}
        d="M10 15c15 44 61 42 83 13 9-11 5-21-3-19-10 3-6 25 18 39"
      />
      <path pathLength={100} d="m94 51 15-3-5-15" />
    </svg>
  );
}

export function HeroStar({ className = "hero-star" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <path d="m30 3 4 19 17-9-12 15 18 7-20-1 4 20-11-17-12 17 5-20-20 1 18-7L9 13l17 9z" />
    </svg>
  );
}

export function CanvasSquiggle() {
  return (
    <svg className="canvas-squiggle" viewBox="0 0 130 40" aria-hidden="true">
      <path d="M2 24c15-25 24 24 41 0S67 1 84 24s25-22 44-5" />
    </svg>
  );
}

export function SmileDoodle() {
  return (
    <svg className="smile-doodle" viewBox="0 0 100 100" aria-hidden="true">
      <circle pathLength={100} cx="50" cy="50" r="43" />
      <path pathLength={100} d="M31 41h1M68 41h1M28 60c14 17 32 18 46 0" />
    </svg>
  );
}

export function ClosingStar() {
  return (
    <svg className="closing-star" viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 2l5 28L69 15 51 37l27 9-29-1 9 28-18-23-18 23 9-28-29 1 27-9L11 15l24 15z" />
    </svg>
  );
}
