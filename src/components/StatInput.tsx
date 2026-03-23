import React from 'react';

interface StatInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  id: string;
}

export const StatInput: React.FC<StatInputProps> = ({ label, value, onChange, min, max, step = 1, id }) => {
  return (
    <div className="flex flex-col gap-2" id={`${id}-container`}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </label>
        <span className="text-sm font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
          {value}
        </span>
      </div>
      <input
        type="range"
        id={id}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
      />
    </div>
  );
};
