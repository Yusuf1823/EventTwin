import React from 'react';

export const Sparkline: React.FC<{
  values: number[];
  color?: string;
  className?: string;
}> = ({ values, color = '#22d3ee', className = 'w-full h-8' }) => {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * 100;
      const y = 18 - ((v - min) / span) * 16;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 20" className={className} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  );
};

export function sparkFrom(value: number) {
  const seed = Math.max(8, value);
  return [0.78, 0.84, 0.8, 0.9, 0.86, 0.95, 1].map((m) => Math.round(seed * m));
}
