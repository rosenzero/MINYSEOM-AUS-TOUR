type Tone = 'indigo' | 'emerald';

interface Blob {
  color: string;
  size: number;
  opacity: number;
  positions: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  anim: string;
}

const PALETTE: Record<Tone, Blob[]> = {
  indigo: [
    {
      color: '#22d3ee',
      size: 340,
      opacity: 0.55,
      positions: { top: '-110px', left: '-80px' },
      anim: 'animate-mesh-drift-1',
    },
    {
      color: '#a78bfa',
      size: 320,
      opacity: 0.55,
      positions: { top: '-40px', right: '-90px' },
      anim: 'animate-mesh-drift-2',
    },
    {
      color: '#ec4899',
      size: 260,
      opacity: 0.45,
      positions: { bottom: '-130px', left: '28%' },
      anim: 'animate-mesh-drift-3',
    },
    {
      color: '#fbbf24',
      size: 220,
      opacity: 0.35,
      positions: { bottom: '-80px', right: '12%' },
      anim: 'animate-mesh-drift-1',
    },
  ],
  emerald: [
    {
      color: '#34d399',
      size: 340,
      opacity: 0.55,
      positions: { top: '-110px', left: '-80px' },
      anim: 'animate-mesh-drift-1',
    },
    {
      color: '#06b6d4',
      size: 300,
      opacity: 0.5,
      positions: { top: '-30px', right: '-80px' },
      anim: 'animate-mesh-drift-2',
    },
    {
      color: '#a7f3d0',
      size: 240,
      opacity: 0.45,
      positions: { bottom: '-110px', left: '32%' },
      anim: 'animate-mesh-drift-3',
    },
    {
      color: '#facc15',
      size: 200,
      opacity: 0.35,
      positions: { bottom: '-70px', right: '18%' },
      anim: 'animate-mesh-drift-1',
    },
  ],
};

export function HeaderMesh({ tone = 'indigo' }: { tone?: Tone }) {
  const blobs = PALETTE[tone];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-3xl ${b.anim}`}
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            opacity: b.opacity,
            ...b.positions,
          }}
        />
      ))}
      {/* gentle bottom darken for text contrast */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent" />
    </div>
  );
}
