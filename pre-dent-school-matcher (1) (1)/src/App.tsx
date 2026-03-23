import React, { useState, useMemo } from 'react';
import { dentalSchools } from './data/schools';
import { schoolCoordinates } from './data/schoolCoordinates';
import { StatInput } from './components/StatInput';
import { SchoolCard } from './components/SchoolCard';
import { InteractiveMap } from './components/InteractiveMap';
import { UserStats, MatchCategory, SchoolStats } from './types';
import { Search, Filter, Info, GraduationCap, Calculator, Sparkles, ArrowUpDown, RotateCw, Map as MapIcon, List } from 'lucide-react';
import { calculateQuartiles } from './utils/stats';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [stats, setStats] = useState<UserStats>({
    aa: 20,
    pat: 20,
    sci: 20,
    totalGpa: 3.5,
    sciGpa: 3.4
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<MatchCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'match' | 'coaInState' | 'coaOutState'>('match');
  const [resetCounter, setResetCounter] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedMapSchool, setSelectedMapSchool] = useState<SchoolStats | null>(null);

  const schoolsWithCoords = useMemo(() => {
    return dentalSchools.map(school => ({
      ...school,
      latitude: schoolCoordinates[school.name]?.lat,
      longitude: schoolCoordinates[school.name]?.lng
    }));
  }, []);

  const coaInStateQuartiles = useMemo(() => {
    const values = dentalSchools.map(s => s.coaInState).filter((v): v is number => v !== undefined);
    return calculateQuartiles(values);
  }, []);

  const coaOutStateQuartiles = useMemo(() => {
    const values = dentalSchools.map(s => s.coaOutState).filter((v): v is number => v !== undefined);
    return calculateQuartiles(values);
  }, []);

  const getMatchCategory = (school: SchoolStats, user: UserStats): MatchCategory => {
    if (user.aa === 0 || user.totalGpa === 0) return 'N/A';

    const aaDiff = user.aa - school.meanAA;
    const gpaDiff = user.totalGpa - school.meanTotalGPA;

    // Safety: User is well above average
    if (aaDiff >= 1.5 && gpaDiff >= 0.15) return 'Safety';
    
    // Median/Target: User is around average
    if (aaDiff >= -0.5 && gpaDiff >= -0.05) return 'Median';
    
    // Reach: User is below average but within competitive range (5th percentile)
    if (user.aa >= school.percentile5AA && user.totalGpa >= school.percentile5TotalGPA) return 'Reach';
    
    // Long Shot: User is below the 5th percentile of admitted students
    return 'Long Shot';
  };

  const calculateMatchPercent = (school: SchoolStats, user: UserStats): number => {
    if (!user.aa || !user.totalGpa) return 0;

    const calculateScore = (val: number, mean: number, p5: number) => {
      // Simple linear interpolation for readability
      // p5 is 25%, mean is 75%
      if (val >= mean) {
        // Scale from 75% to 100% (max out at 100% if significantly above mean)
        const score = 75 + ((val - mean) / (mean - p5)) * 25;
        return Math.min(100, Math.round(score));
      } else if (val >= p5) {
        // Scale from 25% to 75%
        const score = 25 + ((val - p5) / (mean - p5)) * 50;
        return Math.round(score);
      } else {
        // Scale from 0% to 25%
        const score = (val / p5) * 25;
        return Math.max(0, Math.round(score));
      }
    };

    const aaScore = calculateScore(user.aa, school.meanAA, school.percentile5AA);
    const gpaScore = calculateScore(user.totalGpa, school.meanTotalGPA, school.percentile5TotalGPA);

    // Weigh DAT higher (60% DAT, 40% GPA)
    return Math.round((aaScore * 0.6) + (gpaScore * 0.4));
  };

  const filteredSchools = useMemo(() => {
    return schoolsWithCoords
      .map(school => ({
        ...school,
        category: getMatchCategory(school, stats),
        matchPercent: calculateMatchPercent(school, stats)
      }))
      .filter(school => {
        const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             school.state.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterCategory === 'All' || school.category === filterCategory;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'coaInState') {
          return (a.coaInState || 0) - (b.coaInState || 0);
        }
        if (sortBy === 'coaOutState') {
          return (a.coaOutState || 0) - (b.coaOutState || 0);
        }

        // Sort by category priority, then by match percent
        const priority: Record<MatchCategory, number> = {
          'Safety': 0,
          'Median': 1,
          'Reach': 2,
          'Long Shot': 3,
          'N/A': 4
        };
        if (priority[a.category] !== priority[b.category]) {
          return priority[a.category] - priority[b.category];
        }
        return b.matchPercent - a.matchPercent;
      });
  }, [stats, searchTerm, filterCategory]);

  const statsSummary = useMemo(() => {
    const counts = {
      Safety: 0,
      Median: 0,
      Reach: 0,
      'Long Shot': 0,
      'N/A': 0
    };
    filteredSchools.forEach(s => counts[s.category]++);
    return counts;
  }, [filteredSchools]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row" id="app-root">
      {/* Sidebar / Input Section */}
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto md:h-screen sticky top-0 z-10" id="sidebar">
        <div className="flex items-center gap-2.5" id="logo">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Pre-Dent</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">School Matcher</p>
          </div>
        </div>

        <div className="space-y-6" id="inputs-section">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm">
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-emerald-600" />
                <h2>Your Statistics</h2>
              </div>
              <button 
                onClick={() => setStats({ aa: 20, pat: 20, sci: 20, totalGpa: 3.5, sciGpa: 3.4 })}
                className="text-[10px] text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <StatInput 
                id="dat-aa"
                label="DAT AA" 
                value={stats.aa} 
                onChange={(v) => setStats({...stats, aa: v})} 
                min={1} max={30} 
              />
              <StatInput 
                id="dat-pat"
                label="DAT PAT" 
                value={stats.pat} 
                onChange={(v) => setStats({...stats, pat: v})} 
                min={1} max={30} 
              />
            </div>
            <StatInput 
              id="dat-sci"
              label="DAT Total Science" 
              value={stats.sci} 
              onChange={(v) => setStats({...stats, sci: v})} 
              min={1} max={30} 
            />
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <StatInput 
                id="gpa-total"
                label="Total GPA" 
                value={stats.totalGpa} 
                onChange={(v) => setStats({...stats, totalGpa: v})} 
                min={0} max={4.0} step={0.01} 
              />
              <StatInput 
                id="gpa-sci"
                label="Science GPA" 
                value={stats.sciGpa} 
                onChange={(v) => setStats({...stats, sciGpa: v})} 
                min={0} max={4.0} step={0.01} 
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100" id="info-box">
            <div className="flex flex-col gap-3 text-emerald-800">
              <div className="flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">
                  Matches are based on 2025-2026 ADEA Guide data (Fall 2024 enrollees).
                </p>
              </div>
              <div className="text-[10px] space-y-1 opacity-80">
                <p>• <span className="font-bold">100% Score:</span> At or above median enrollees.</p>
                <p>• <span className="font-bold">50% Score:</span> At the 5th percentile floor.</p>
                <p>• <span className="font-bold">0% Score:</span> Below the competitive range.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 hidden md:block" id="footer">
          <p className="text-[10px] text-slate-400 font-medium">
            Data sourced from ADEA Official Guide to Dental Schools 2023-2024.
          </p>
        </div>
      </aside>

      {/* Main Content / Results Section */}
      <main className="flex-1 p-6 md:p-10 bg-slate-50 overflow-y-auto" id="main-content">
        <header className="max-w-5xl mx-auto mb-8 space-y-6" id="header">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                School Matches
                <Sparkles size={20} className="text-amber-400 fill-amber-400" />
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Showing {filteredSchools.length} schools matching your criteria
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                    viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <List size={14} />
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                    viewMode === 'map' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MapIcon size={14} />
                  Map
                </button>
              </div>

              <button
                onClick={() => setResetCounter(prev => prev + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              >
                <RotateCw size={14} />
                Reset All Cards
              </button>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by school or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-64 transition-all shadow-sm"
                  id="search-input"
                />
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer shadow-sm transition-all min-w-[140px]"
                    id="sort-select"
                  >
                    <option value="match">Sort: Match</option>
                    <option value="coaInState">Sort: COA (In-State)</option>
                    <option value="coaOutState">Sort: COA (Out-State)</option>
                  </select>
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer shadow-sm transition-all min-w-[140px]"
                    id="filter-select"
                  >
                    <option value="All">All Categories</option>
                    <option value="Safety">Safety</option>
                    <option value="Median">Median</option>
                    <option value="Reach">Reach</option>
                    <option value="Long Shot">Long Shot</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap gap-2" id="stats-pills">
            {(['Safety', 'Median', 'Reach', 'Long Shot'] as MatchCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? 'All' : cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                  filterCategory === cat 
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                  filterCategory === cat ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {statsSummary[cat]}
                </span>
              </button>
            ))}
          </div>
        </header>

        <div className="max-w-5xl mx-auto" id="results-grid">
          {viewMode === 'map' ? (
            <div className="space-y-6">
              <InteractiveMap 
                schools={filteredSchools as any} 
                onSchoolClick={(s) => setSelectedMapSchool(s)}
                selectedSchool={selectedMapSchool}
                userStats={stats}
              />
              
              {/* Show list below map for accessibility */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-50 pointer-events-none grayscale">
                 {filteredSchools.slice(0, 2).map((school, idx) => (
                  <SchoolCard 
                    key={school.name} 
                    school={school} 
                    category={school.category} 
                    matchPercent={school.matchPercent}
                    userStats={stats}
                    coaInStateQuartiles={coaInStateQuartiles}
                    coaOutStateQuartiles={coaOutStateQuartiles}
                    resetCounter={resetCounter}
                    id={`school-map-preview-${idx}`}
                  />
                ))}
              </div>
            </div>
          ) : filteredSchools.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredSchools.map((school, idx) => (
                  <SchoolCard 
                    key={school.name} 
                    school={school} 
                    category={school.category} 
                    matchPercent={school.matchPercent}
                    userStats={stats}
                    coaInStateQuartiles={coaInStateQuartiles}
                    coaOutStateQuartiles={coaOutStateQuartiles}
                    resetCounter={resetCounter}
                    id={`school-${idx}`}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300" id="no-results">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No schools found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                Try adjusting your search terms or filters to see more results.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
