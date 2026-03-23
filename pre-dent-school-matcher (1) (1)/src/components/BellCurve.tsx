import React from 'react';
import { motion } from 'motion/react';

interface BellCurveProps {
  mean: number;
  p5: number;
  p95: number;
  userValue: number;
  color: string;
  label: string;
}

export const BellCurve: React.FC<BellCurveProps> = ({ mean, p5, p95, userValue, color, label }) => {
  // Estimate standard deviation from 5th and 95th percentiles
  // p95 - p5 covers ~90% of the distribution, which is ~3.29 standard deviations
  const sigma = (p95 - p5) / 3.29;
  
  // Normal distribution function
  const normalPDF = (x: number, mu: number, s: number) => {
    return (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / s, 2));
  };

  const width = 200;
  const height = 60;
  const padding = 10;

  // Generate points for the curve
  const points: [number, number][] = [];
  const start = p5 - sigma;
  const end = p95 + sigma;
  const step = (end - start) / 40;

  for (let x = start; x <= end; x += step) {
    const px = padding + ((x - start) / (end - start)) * (width - 2 * padding);
    const y = normalPDF(x, mean, sigma);
    const py = height - padding - (y / normalPDF(mean, mean, sigma)) * (height - 2 * padding);
    points.push([px, py]);
  }

  const pathData = `M ${points.map(p => p.join(',')).join(' L ')}`;

  // User position
  const userX = padding + ((userValue - start) / (end - start)) * (width - 2 * padding);
  const isClipped = userX < padding || userX > width - padding;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center px-1">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label} Distribution</span>
        <span className="text-[8px] font-mono font-bold text-slate-500">μ={mean}</span>
      </div>
      <svg width={width} height={height} className="overflow-visible">
        {/* The Curve */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={color}
          strokeLinecap="round"
        />
        
        {/* Mean Line */}
        <line
          x1={padding + ((mean - start) / (end - start)) * (width - 2 * padding)}
          y1={height - padding}
          x2={padding + ((mean - start) / (end - start)) * (width - 2 * padding)}
          y2={padding}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2,2"
          className="text-slate-300"
        />

        {/* User Marker */}
        {!isClipped && (
          <g transform={`translate(${userX}, ${height - padding})`}>
            <motion.circle
              initial={{ r: 0 }}
              animate={{ r: 4 }}
              fill="currentColor"
              className={color}
            />
            <motion.line
              initial={{ y2: 0 }}
              animate={{ y2: -height + 2 * padding }}
              x1="0"
              y1="0"
              x2="0"
              stroke="currentColor"
              strokeWidth="2"
              className={color}
            />
            <text
              y="-45"
              textAnchor="middle"
              className={`text-[10px] font-black fill-current ${color}`}
            >
              YOU
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
