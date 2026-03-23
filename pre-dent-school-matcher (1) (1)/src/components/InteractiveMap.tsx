import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { SchoolStats, MatchCategory, UserStats } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, GraduationCap, ExternalLink, Info } from 'lucide-react';

interface InteractiveMapProps {
  schools: (SchoolStats & { category: MatchCategory; matchPercent: number })[];
  onSchoolClick: (school: SchoolStats) => void;
  selectedSchool: SchoolStats | null;
  userStats: UserStats;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  schools, 
  onSchoolClick, 
  selectedSchool,
  userStats
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Color mapping for categories
  const categoryColors: Record<MatchCategory, string> = {
    'Safety': '#10b981', // emerald-500
    'Median': '#3b82f6', // blue-500
    'Reach': '#f59e0b', // amber-500
    'Long Shot': '#ef4444', // red-500
    'N/A': '#94a3b8' // slate-400
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: width * 0.6 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const projection = d3.geoAlbersUsa()
      .scale(width * 1.2)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Background click to deselect
    svg.on('click', () => onSchoolClick(null as any));

    // Draw the US map
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then((us: any) => {
      const states = topojson.feature(us, us.objects.states) as any;

      svg.append('g')
        .selectAll('path')
        .data(states.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#f8fafc')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 0.5);

      // Draw schools
      const markers = svg.append('g');

      schools.forEach(school => {
        if (school.latitude && school.longitude) {
          const coords = projection([school.longitude, school.latitude]);
          if (coords) {
            markers.append('circle')
              .attr('cx', coords[0])
              .attr('cy', coords[1])
              .attr('r', selectedSchool?.name === school.name ? 8 : 4)
              .attr('fill', categoryColors[school.category])
              .attr('stroke', 'white')
              .attr('stroke-width', 1)
              .attr('class', `cursor-pointer transition-all ${selectedSchool?.name === school.name ? 'animate-pulse' : ''}`)
              .style('filter', selectedSchool?.name === school.name ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none')
              .on('click', (event) => {
                event.stopPropagation();
                onSchoolClick(school);
              })
              .append('title')
              .text(`${school.name} (${school.category})`);
          }
        }
      });
    });
  }, [dimensions, schools, selectedSchool]);

  return (
    <div ref={containerRef} className="relative w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-sm">Interactive School Map</h3>
        </div>
        <div className="flex gap-4">
          {(['Safety', 'Median', 'Reach', 'Long Shot'] as MatchCategory[]).map(cat => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="w-full h-auto"
        />

        <AnimatePresence>
          {selectedSchool && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 z-20"
            >
              <button 
                onClick={() => onSchoolClick(null as any)}
                className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight pr-6">{selectedSchool.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedSchool.state} • {selectedSchool.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mean AA</p>
                  <p className="text-sm font-bold text-slate-700">{selectedSchool.meanAA}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mean GPA</p>
                  <p className="text-sm font-bold text-slate-700">{selectedSchool.meanTotalGPA}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: categoryColors[(selectedSchool as any).category] }}
                  >
                    {(selectedSchool as any).category}
                  </div>
                  <span className="text-xs font-bold text-slate-600">{(selectedSchool as any).matchPercent}% Match</span>
                </div>
                
                {selectedSchool.website && (
                  <a 
                    href={selectedSchool.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <Info size={14} className="text-slate-400" />
        <p className="text-[10px] text-slate-500">Click on a marker to view school details. Markers are color-coded by your match probability.</p>
      </div>
    </div>
  );
};
