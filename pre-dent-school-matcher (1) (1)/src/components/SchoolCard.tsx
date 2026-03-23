import React, { useState, useEffect } from 'react';
import { SchoolStats, MatchCategory, UserStats } from '../types';
import { MapPin, Target, GraduationCap, BarChart3, ExternalLink, RotateCw, DollarSign, Award } from 'lucide-react';
import { getCOAColor } from '../utils/stats';
import { motion } from 'motion/react';

interface SchoolCardProps {
  school: SchoolStats;
  category: MatchCategory;
  matchPercent: number;
  userStats: UserStats;
  coaInStateQuartiles: { q1: number; q2: number; q3: number };
  coaOutStateQuartiles: { q1: number; q2: number; q3: number };
  resetCounter: number;
  id: string;
}

const cardStyles: Record<MatchCategory, string> = {
  'Safety': 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50',
  'Median': 'bg-blue-50/50 border-blue-200 hover:bg-blue-50',
  'Reach': 'bg-amber-50/50 border-amber-200 hover:bg-amber-50',
  'Long Shot': 'bg-rose-50/50 border-rose-200 hover:bg-rose-50',
  'N/A': 'bg-slate-50 border-slate-200'
};

const badgeStyles: Record<MatchCategory, string> = {
  'Safety': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Median': 'bg-blue-100 text-blue-700 border-blue-200',
  'Reach': 'bg-amber-100 text-amber-700 border-amber-200',
  'Long Shot': 'bg-rose-100 text-rose-700 border-rose-200',
  'N/A': 'bg-slate-100 text-slate-700 border-slate-200'
};

export const SchoolCard: React.FC<SchoolCardProps> = ({ 
  school, 
  category, 
  matchPercent, 
  userStats, 
  coaInStateQuartiles,
  coaOutStateQuartiles,
  resetCounter,
  id 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [resetCounter]);

  const formatCurrency = (val: number | undefined) => 
    val ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : 'N/A';

  const coaInStateFormatted = formatCurrency(school.coaInState);
  const coaOutStateFormatted = formatCurrency(school.coaOutState);
  const coaInStateColor = getCOAColor(school.coaInState, coaInStateQuartiles);
  const coaOutStateColor = getCOAColor(school.coaOutState, coaOutStateQuartiles);

  const getQuartile = (val: number, p25: number, p50: number, p75: number) => {
    if (val < p25) return 'Q1';
    if (val < p50) return 'Q2';
    if (val < p75) return 'Q3';
    return 'Q4';
  };

  const renderStatBar = (
    label: string, 
    userVal: number, 
    schoolMean: number, 
    p5: number, 
    p95: number, 
    p25?: number, 
    p75?: number,
    min: number = 15,
    max: number = 30,
    color: string = 'emerald',
    isMain: boolean = true
  ) => {
    // Estimate p25/p75 if missing
    const q1 = p25 || schoolMean - 0.4 * (schoolMean - p5);
    const q3 = p75 || schoolMean + 0.4 * (p95 - schoolMean);
    const userQuartile = getQuartile(userVal, q1, schoolMean, q3);
    const range = max - min;

    return (
      <div className={`${isMain ? 'bg-white/40 p-4' : 'bg-white/20 p-3'} rounded-2xl border border-black/5 space-y-2`}>
        <div className="flex justify-between items-center">
          <span className={`${isMain ? 'text-[10px]' : 'text-[9px]'} font-black text-slate-400 uppercase tracking-widest`}>{label}</span>
          <div className="flex gap-4">
            <div className="text-center">
              <p className={`${isMain ? 'text-[8px]' : 'text-[7px]'} text-slate-400 font-bold uppercase mb-0.5`}>You ({userQuartile})</p>
              <p className={`${isMain ? 'text-xl' : 'text-base'} font-mono font-black text-${color}-600`}>{typeof userVal === 'number' && !Number.isInteger(userVal) ? userVal.toFixed(2) : userVal}</p>
            </div>
            <div className="text-center">
              <p className={`${isMain ? 'text-[8px]' : 'text-[7px]'} text-slate-400 font-bold uppercase mb-0.5`}>Median</p>
              <p className={`${isMain ? 'text-xl' : 'text-base'} font-mono font-black text-slate-900`}>{typeof schoolMean === 'number' && !Number.isInteger(schoolMean) ? schoolMean.toFixed(2) : schoolMean}</p>
            </div>
          </div>
        </div>
        <div className={`${isMain ? 'h-3' : 'h-2.5'} bg-slate-200/50 rounded-full overflow-hidden relative`}>
          {/* 5-95 Range */}
          <div 
            className={`absolute top-0 bottom-0 bg-${color}-500/10`} 
            style={{ 
              left: `${((p5 - min) / range) * 100}%`, 
              width: `${((p95 - p5) / range) * 100}%` 
            }}
          />
          {/* 25-75 Range (Interquartile) */}
          <div 
            className={`absolute top-0 bottom-0 bg-${color}-500/20`} 
            style={{ 
              left: `${((q1 - min) / range) * 100}%`, 
              width: `${((q3 - q1) / range) * 100}%` 
            }}
          />
          {/* Quartile Markers */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="absolute h-full w-[1px] bg-black/5" style={{ left: `${((q1 - min) / range) * 100}%` }} />
            <div className="absolute h-full w-[1px] bg-black/10" style={{ left: `${((schoolMean - min) / range) * 100}%` }} />
            <div className="absolute h-full w-[1px] bg-black/5" style={{ left: `${((q3 - min) / range) * 100}%` }} />
          </div>
          {/* User Marker */}
          <motion.div 
            initial={{ left: 0 }}
            animate={{ left: `${((userVal - min) / range) * 100}%` }}
            className={`absolute top-1/2 -translate-y-1/2 ${isMain ? 'w-1.5 h-5' : 'w-1 h-4'} bg-${color}-600 rounded-full z-10 shadow-sm border border-white`}
          />
        </div>
        <div className="flex justify-between px-1">
          <span className="text-[7px] text-slate-400 font-bold">P5: {p5}</span>
          <span className="text-[7px] text-slate-400 font-bold">Q1: {q1.toFixed(1)}</span>
          <span className="text-[7px] text-slate-400 font-bold">Q3: {q3.toFixed(1)}</span>
          <span className="text-[7px] text-slate-400 font-bold">P95: {p95}</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="perspective-1000 h-[750px] cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
      id={id}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-full h-full preserve-3d"
      >
        {/* Front Side */}
        <div className={`absolute inset-0 backface-hidden border-2 rounded-2xl p-6 flex flex-col overflow-hidden shadow-sm transition-shadow group-hover:shadow-md ${cardStyles[category]}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex-1 pr-4">
              <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-slate-950 transition-colors">
                {school.name}
              </h3>
              <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                <MapPin size={14} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-widest">{school.state}</span>
                {school.type && (
                  <>
                    <span className="text-slate-300 mx-1">•</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{school.type}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-col items-center justify-center bg-white shadow-sm border border-slate-200 rounded-2xl p-3 min-w-[100px]">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter leading-none mb-1">Match Score</p>
                <p className={`text-3xl font-mono font-black leading-none ${
                  matchPercent > 80 ? 'text-emerald-600' : 
                  matchPercent > 60 ? 'text-blue-600' : 
                  matchPercent > 40 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {matchPercent || 0}%
                </p>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${badgeStyles[category]}`}>
                {category}
              </span>
            </div>
          </div>

          {/* Main Comparison Section - Highly Readable */}
          <div className="space-y-6 mb-6 relative z-10 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {/* DAT Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-emerald-600" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DAT Performance</h4>
              </div>
              {renderStatBar('DAT AA', userStats.aa, school.meanAA, school.percentile5AA, school.percentile95AA, school.percentile25AA, school.percentile75AA, 15, 30, 'emerald', true)}
              <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-emerald-100">
                {renderStatBar('DAT PAT', userStats.pat, school.meanPAT, school.percentile5PAT || school.meanPAT - 2, school.percentile95PAT || school.meanPAT + 3, school.percentile25PAT, school.percentile75PAT, 15, 30, 'emerald', false)}
                {renderStatBar('DAT Sci', userStats.sci, school.meanSci, school.percentile5Sci || school.meanSci - 2, school.percentile95Sci || school.meanSci + 3, school.percentile25Sci, school.percentile75Sci, 15, 30, 'emerald', false)}
              </div>
            </div>
            
            {/* GPA Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={16} className="text-blue-600" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Standing</h4>
              </div>
              {renderStatBar('Total GPA', userStats.totalGpa, school.meanTotalGPA, school.percentile5TotalGPA, school.percentile95TotalGPA, school.percentile25TotalGPA, school.percentile75TotalGPA, 2.0, 4.0, 'blue', true)}
              <div className="pl-4 border-l-2 border-blue-100">
                {renderStatBar('Sci GPA', userStats.sciGpa, school.meanSciGPA, school.percentile5SciGPA || school.meanSciGPA - 0.4, school.percentile95SciGPA || 4.0, school.percentile25SciGPA, school.percentile75SciGPA, 2.0, 4.0, 'blue', false)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
            <div className="bg-white/60 rounded-xl p-3 border border-black/5 flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <DollarSign size={16} />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter leading-none mb-1">In-State COA</p>
                <p className={`text-sm font-mono font-black ${coaInStateColor}`}>{coaInStateFormatted}</p>
              </div>
            </div>
            <div className="bg-white/60 rounded-xl p-3 border border-black/5 flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <DollarSign size={16} />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter leading-none mb-1">Out-of-State COA</p>
                <p className={`text-sm font-mono font-black ${coaOutStateColor}`}>{coaOutStateFormatted}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-black/5 flex justify-center items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <RotateCw size={12} />
            Flip for Mission & Details
          </div>
        </div>

        {/* Back Side */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 border-2 rounded-2xl p-6 flex flex-col overflow-y-auto ${cardStyles[category]}`}>
          <div className="mb-4 border-b border-black/5 pb-4">
            <h3 className="font-black text-slate-900 text-lg leading-tight">
              {school.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{school.state}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-black text-slate-900 text-lg leading-tight mb-4 flex items-center gap-2">
              <Award size={18} className="text-emerald-600" />
              Mission Statement
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed italic border-l-4 border-emerald-200 pl-4 py-1">
              "{school.missionStatement || "To provide exceptional dental education and patient-centered care to the community we serve."}"
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About the Program</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {school.description || "This institution is recognized for its commitment to excellence in dental education and clinical training. Students benefit from a rigorous curriculum and diverse patient populations."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/40 p-3 rounded-xl border border-black/5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Grading Scale</p>
              <p className="text-sm font-bold text-slate-800">{school.gradingScale || "A-F"}</p>
            </div>
            <div className="bg-white/40 p-3 rounded-xl border border-black/5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">In-State COA</p>
              <p className={`text-sm font-bold ${coaInStateColor}`}>{coaInStateFormatted}/yr</p>
            </div>
            <div className="bg-white/40 p-3 rounded-xl border border-black/5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Out-of-State COA</p>
              <p className={`text-sm font-bold ${coaOutStateColor}`}>{coaOutStateFormatted}/yr</p>
            </div>
            <div className="bg-white/40 p-3 rounded-xl border border-black/5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Class Size</p>
              <p className="text-sm font-bold text-slate-800">{school.classSize || "N/A"}</p>
            </div>
            <div className="bg-white/40 p-3 rounded-xl border border-black/5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Acceptance</p>
              <p className="text-sm font-bold text-slate-800">{school.acceptanceRate || "N/A"}</p>
            </div>
            <div className="bg-white/40 p-3 rounded-xl border border-black/5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Deadline</p>
              <p className="text-sm font-bold text-slate-800">{school.deadline || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-2 mt-auto">
            {school.website && (
              <a 
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm"
              >
                Visit Official Site
                <ExternalLink size={12} />
              </a>
            )}
            <button 
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              <RotateCw size={12} />
              Back to Stats
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
