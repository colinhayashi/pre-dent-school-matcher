import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { SchoolStats, MatchCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Simplified US TopoJSON URL
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const stateCentroids: Record<string, [number, number]> = {
  AL: [-86.9023, 32.3182],
  AK: [-154.4931, 63.5888],
  AZ: [-111.0937, 34.0489],
  AR: [-92.1999, 34.7486],
  CA: [-119.4179, 36.7783],
  CO: [-105.7821, 39.5501],
  CT: [-72.6833, 41.6032],
  DE: [-75.5277, 38.9108],
  FL: [-81.5158, 27.6648],
  GA: [-83.5002, 32.1574],
  HI: [-155.5828, 19.8968],
  ID: [-114.742, 44.0682],
  IL: [-89.3985, 40.6331],
  IN: [-86.1269, 40.2672],
  IA: [-93.0977, 41.878],
  KS: [-98.4842, 38.4981],
  KY: [-84.27, 37.8393],
  LA: [-91.9623, 30.9843],
  ME: [-69.4455, 45.2538],
  MD: [-76.6413, 39.0458],
  MA: [-71.3824, 42.4072],
  MI: [-85.6024, 44.3148],
  MN: [-94.6859, 46.7296],
  MS: [-89.3985, 32.3547],
  MO: [-92.2884, 37.9643],
  MT: [-110.3626, 46.8797],
  NE: [-99.9018, 41.4925],
  NV: [-116.4194, 38.8026],
  NH: [-71.5724, 43.1939],
  NJ: [-74.4057, 40.0583],
  NM: [-105.8701, 34.5199],
  NY: [-74.2179, 43.2994],
  NC: [-79.0193, 35.7596],
  ND: [-101.002, 47.5515],
  OH: [-82.9071, 40.4173],
  OK: [-97.0929, 35.0078],
  OR: [-120.5542, 43.8041],
  PA: [-77.1945, 41.2033],
  RI: [-71.4774, 41.5801],
  SC: [-81.1637, 33.8361],
  SD: [-99.9018, 44.3683],
  TN: [-86.5804, 35.5175],
  TX: [-99.9018, 31.9686],
  UT: [-111.0937, 39.321],
  VT: [-72.5778, 44.5588],
  VA: [-78.6569, 37.4316],
  WA: [-120.7401, 47.7511],
  WV: [-80.4549, 38.5976],
  WI: [-89.6165, 43.7844],
  WY: [-107.2903, 43.076],
  DC: [-77.0369, 38.9072]
};

interface SchoolMapProps {
  schools: (SchoolStats & { category: MatchCategory; matchPercent: number })[];
  onSchoolClick: (school: SchoolStats) => void;
  selectedSchoolName?: string;
}

const categoryColors: Record<MatchCategory, string> = {
  Safety: '#059669', // emerald-600
  Median: '#2563eb', // blue-600
  Reach: '#d97706', // amber-600
  'Long Shot': '#e11d48', // rose-600
  'N/A': '#94a3b8' // slate-400
};

export function SchoolMap({ schools, onSchoolClick, selectedSchoolName }: SchoolMapProps) {
  const [hoveredSchool, setHoveredSchool] = useState<string | null>(null);

  const schoolsByState = useMemo(() => {
    const groups: Record<string, typeof schools> = {};
    schools.forEach(school => {
      if (!groups[school.state]) groups[school.state] = [];
      groups[school.state].push(school);
    });
    return groups;
  }, [schools]);

  const markers = useMemo(() => {
    const allMarkers: any[] = [];
    const entries = Object.entries(schoolsByState);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const stateAbbr = entry[0];
      const schoolsInState = entry[1] as (SchoolStats & { category: MatchCategory; matchPercent: number })[];
      
      for (let j = 0; j < schoolsInState.length; j++) {
        const school = schoolsInState[j];
        const base = stateCentroids[stateAbbr] || [0, 0];
        let position = base;
        
        if (schoolsInState.length > 1) {
          const radius = 0.6; // degrees
          const angle = (j / schoolsInState.length) * 2 * Math.PI;
          position = [
            base[0] + radius * Math.cos(angle),
            base[1] + radius * Math.sin(angle)
          ];
        }

        allMarkers.push({
          ...school,
          coordinates: position
        });
      }
    }
    return allMarkers;
  }, [schoolsByState]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm overflow-hidden relative" id="school-map-container">
      <div className="absolute top-4 left-4 z-10 space-y-1">
        <h3 className="text-sm font-bold text-slate-800">Map View</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Click markers to view details</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-white/80 backdrop-blur-sm p-2.5 rounded-lg border border-slate-100 shadow-sm">
        {(Object.keys(categoryColors) as MatchCategory[]).map(cat => (
          <div key={cat} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{cat}</span>
          </div>
        ))}
      </div>

      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoUrl}>
          {(data) => {
            const geographies = data?.geographies || [];
            return geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#f1f5f9", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ));
          }}
        </Geographies>
        {markers.map((school) => (
          <Marker 
            key={school.name} 
            coordinates={school.coordinates}
            onMouseEnter={() => setHoveredSchool(school.name)}
            onMouseLeave={() => setHoveredSchool(null)}
            onClick={() => onSchoolClick(school)}
          >
            <motion.circle
              r={selectedSchoolName === school.name ? 6 : 4}
              fill={categoryColors[school.category]}
              stroke="#fff"
              strokeWidth={selectedSchoolName === school.name ? 2 : 1}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.5 }}
              style={{ cursor: 'pointer' }}
            />
          </Marker>
        ))}
      </ComposableMap>

      <AnimatePresence>
        {hoveredSchool && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl pointer-events-none z-20"
          >
            {hoveredSchool}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
