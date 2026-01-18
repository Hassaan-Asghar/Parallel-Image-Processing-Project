import { Cpu, Activity } from 'lucide-react';

interface CpuVisualizationProps {
  isProcessing: boolean;
  coreCount?: number;
}

export const CpuVisualization = ({ isProcessing, coreCount = 4 }: CpuVisualizationProps) => {
  // Create an array of fake "cores"
  const cores = Array.from({ length: coreCount }, (_, i) => i);

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10 bg-black/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${isProcessing ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          CPU THREADS ({coreCount})
        </h3>
        <div className={`
            flex items-center gap-2 px-2 py-1 rounded-full border text-[10px] font-mono tracking-wider
            ${isProcessing 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-white/5 border-white/10 text-muted-foreground'}
        `}>
           <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
           {isProcessing ? 'PROCESSING' : 'READY'}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cores.map((core) => (
          <div 
            key={core}
            className={`
              h-12 rounded bg-black/40 border transition-all duration-300 flex items-center justify-center relative overflow-hidden
              ${isProcessing 
                ? 'border-primary/40 shadow-[0_0_8px_rgba(0,255,255,0.1)]' 
                : 'border-white/5 opacity-60'}
            `}
          >
            {/* Background Activity Graph */}
            {isProcessing && (
                <div className="absolute inset-0 opacity-20 flex items-end justify-between px-1">
                     {[1,2,3,4,5].map(i => (
                         <div key={i} className="w-1 bg-primary animate-pulse" 
                              style={{ 
                                  height: `${Math.random() * 80 + 20}%`,
                                  animationDuration: `${0.5 + Math.random()}s`
                              }} 
                         />
                     ))}
                </div>
            )}

            <div className={`
              w-full h-full flex items-end justify-center pb-1 gap-0.5 px-2 relative z-10
            `}>
              {/* Load Bars */}
              {[1,2,3,4].map(bar => (
                 <div 
                   key={bar} 
                   className={`
                     w-1.5 rounded-sm transition-all duration-300
                     ${isProcessing 
                        ? 'bg-primary shadow-[0_0_5px_hsl(var(--primary))]' 
                        : 'bg-white/10'}
                   `}
                   style={{
                     height: isProcessing 
                        ? `${Math.random() * 60 + 30}%` // Random height when processing
                        : '4px', // Flat line when idle
                     animation: isProcessing ? `pulse 0.5s infinite alternate` : 'none',
                     animationDelay: `${core * 0.1 + bar * 0.05}s`
                   }}
                 />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};