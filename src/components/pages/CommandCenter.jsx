import React, { useMemo } from 'react';
import useStore from '../../store/useStore';

export default function CommandCenter({ onViewArmory }) {
  const assets = useStore(state => state.assets); // Selector

  // Keeping this simple for now. 
  // Might need to debounce this if we hit >1000 assets, but YAGNI.
  const stats = useMemo(() => {
    const total = assets.length;
    const compromised = assets.filter(a => a.status === 'COMPROMISED').length;
    const deployed = assets.filter(a => a.status === 'DEPLOYED').length;
    const pristine = assets.filter(a => a.status === 'PRISTINE').length;
    
    const readiness = total > 0 ? Math.round((pristine / total) * 100) : 0;
    
    return { total, compromised, deployed, pristine, readiness };
  }, [assets]);

  // Aggregating everything that happened recently. 
  // Hope this doesn't get too messy with 50+ assets.
  const recentLogs = useMemo(() => {
    // Flatten all logs from all assets
    const allLogs = assets.flatMap(asset => 
      (asset.logs || []).map(log => ({
        ...log,
        assetName: asset.name,
        assetId: asset.id
      }))
    );
    
    // Sort by timestamp descending (newest first)
    return allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [assets]);

  // Math for the circles. Don't touch unless you know SVG paths.
  const gaugeRadius = 60;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (stats.readiness / 100) * gaugeCircumference;

  return (
    <div className="h-full flex flex-col p-8 space-y-8 animate-in fade-in zoom-in duration-300">
      
      {/* HEADER */}
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-cyan-neon/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white flex items-center gap-4">
            <span className="text-cyan-neon animate-pulse">⬤</span> 
            COMMAND CENTER 
          </h1>
          <div className="flex items-center gap-4 mt-2 ml-10">
             <span className="text-[10px] font-normal text-cyan-neon bg-cyan-neon/10 px-2 py-0.5 rounded border border-cyan-neon/30 tracking-widest uppercase">
              System Ready
            </span>
            <p className="text-dim font-mono text-sm hidden sm:block">TACTICAL OVERVIEW // UNIT 734</p>
          </div>
        </div>
        
        <button 
          onClick={onViewArmory}
          className="bg-cyan-neon text-black font-bold px-6 py-2 md:px-8 md:py-3 rounded-sm hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,240,255,0.3)] tracking-widest whitespace-nowrap self-start md:self-auto"
        >
          OPEN ARMORY &rarr;
        </button>
      </div>

      {/* TOP GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-0 shrink-0">
        
        {/* MODULE A: READINESS GAUGE */}
        {/* Looks cool, vaguely functional. */}
        <div className="bg-armor border border-dim p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />
          <h2 className="text-dim font-bold tracking-widest text-sm mb-4">SYSTEM READINESS</h2>
          
          <div className="flex items-center justify-center relative h-48">
             <svg className="transform -rotate-90 w-48 h-48">
               {/* Background Circle */}
               <circle
                 cx="96" cy="96" r={gaugeRadius}
                 stroke="#262626" strokeWidth="12" fill="transparent"
               />
               {/* Progress Circle */}
               <circle
                 cx="96" cy="96" r={gaugeRadius}
                 stroke={stats.readiness > 80 ? '#00F0FF' : stats.readiness > 50 ? '#FFB800' : '#FF003C'}
                 strokeWidth="12" fill="transparent"
                 strokeDasharray={gaugeCircumference}
                 strokeDashoffset={gaugeOffset}
                 className="transition-all duration-1000 ease-out"
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className={`text-4xl font-black ${stats.readiness > 80 ? 'text-cyan-neon' : stats.readiness > 50 ? 'text-amber-warn' : 'text-red-glitch'}`}>
                 {stats.readiness}%
               </span>
               <span className="text-[10px] text-dim tracking-widest mt-1">PRISTINE</span>
             </div>
          </div>
        </div>

        {/* MODULE C: QUICK STATS */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {/* OPERATIONAL */}
          <div className="bg-armor border border-cyan-neon/20 p-6 flex flex-col justify-between relative hover:border-cyan-neon/50 transition-colors group">
            <h3 className="text-cyan-neon text-xs font-bold tracking-widest">OPERATIONAL</h3>
            <div className="text-5xl font-black text-white mt-4">{stats.total}</div>
            <div className="text-[10px] text-dim mt-2 font-mono">ASSETS REGISTERED</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-neon/20 group-hover:bg-cyan-neon transition-colors" />
          </div>

          {/* COMPROMISED */}
          <div className="bg-armor border border-red-glitch/20 p-6 flex flex-col justify-between relative hover:border-red-glitch/50 transition-colors group">
            <h3 className="text-red-glitch text-xs font-bold tracking-widest">COMPROMISED</h3>
            <div className="text-5xl font-black text-white mt-4 animate-pulse">{stats.compromised}</div>
            <div className="text-[10px] text-dim mt-2 font-mono">IMMEDIATE ACTION REQ</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-red-glitch/20 group-hover:bg-red-glitch transition-colors" />
          </div>

          {/* IN FIELD */}
          <div className="bg-armor border border-amber-warn/20 p-6 flex flex-col justify-between relative hover:border-amber-warn/50 transition-colors group">
            <h3 className="text-amber-warn text-xs font-bold tracking-widest">IN FIELD</h3>
            <div className="text-5xl font-black text-white mt-4">{stats.deployed}</div>
            <div className="text-[10px] text-dim mt-2 font-mono">ACTIVE OPERATIONS</div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-warn/20 group-hover:bg-amber-warn transition-colors" />
          </div>
        </div>
      </div>

      {/* MODULE B: GLOBAL FLIGHT RECORDER */}
      <div className="flex-1 bg-armor border border-dim p-6 relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 p-2 opacity-20">
             <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H100V100H0V0Z" fill="url(#grid)" />
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M10 0L0 0L0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
             </svg>
        </div>
        
        <h2 className="text-dim font-bold tracking-widest text-sm mb-4 flex items-center gap-2">
          <span>📡</span> GLOBAL FLIGHT RECORDER // LIVE FEED
        </h2>

        <div className="flex-1 overflow-auto space-y-2 pr-2">
          {recentLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-dim italic">
              No recent activity recorded.
            </div>
          ) : (
            recentLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-4 p-3 border-b border-dim/30 hover:bg-dim/10 transition-colors font-mono text-xs">
                <div className="text-cyan-neon w-20 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </div>
                <div className="text-white font-bold w-32 shrink-0 truncate" title={log.assetName}>
                  {log.assetName}
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold w-24 text-center shrink-0 ${
                  log.type === 'CREATED' ? 'bg-cyan-neon/10 text-cyan-neon' :
                  log.type === 'COMPROMISED' ? 'bg-red-glitch/10 text-red-glitch' :
                  log.type === 'DEPLOYED' ? 'bg-amber-warn/10 text-amber-warn' :
                  'bg-dim/20 text-dim'
                }`}>
                  {log.type}
                </div>
                <div className="text-dim flex-1 truncate">
                  {log.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
