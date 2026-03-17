import * as React from 'react';

// ── Button ─────────────────────────────────────────────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({
  variant = 'primary', size = 'md', loading, children, disabled, className = '', ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
    ghost:     'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60',
    danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = '', hover = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl ${hover ? 'hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: React.ReactNode }) {
  const colors: Record<BadgeColor, string> = {
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/15   text-amber-400   border-amber-500/20',
    red:    'bg-red-500/15     text-red-400     border-red-500/20',
    blue:   'bg-sky-500/15     text-sky-400     border-sky-500/20',
    gray:   'bg-slate-700/50   text-slate-400   border-slate-600/30',
    purple: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// ── StarRating ─────────────────────────────────────────────────────────────
export function StarRating({ rating, max = 5, size = 16 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < rating ? '#f59e0b' : 'none'} stroke={i < rating ? '#f59e0b' : '#475569'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 40, accent = '#06b6d4' }: { name: string; src?: string; size?: number; accent?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} width={size} height={size} style={{ borderRadius: size / 4, objectFit: 'cover' }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: size / 4, background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#06b6d4' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
