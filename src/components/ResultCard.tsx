import { ImageComparison } from './ImageComparison';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';
import type { ProcessingResult } from '@/lib/api';

interface ResultCardProps {
  result: ProcessingResult;
  index: number;
}

export const ResultCard = ({ result, index }: ResultCardProps) => {
  return (
    <Card className="glass-card overflow-hidden border-white/5 bg-black/20">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
           <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
             Image #{index + 1}
           </Badge>
           <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
             Noise: {result.noise_type}
           </span>
        </div>

        {/* The New Comparison Slider */}
        <div className="rounded-lg overflow-hidden ring-1 ring-white/10">
          <ImageComparison 
            beforeImage={result.original_image} 
            afterImage={result.segmented_image}
            label={result.noise_type}
          />
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Sequential
            </span>
            <span className="text-lg font-mono text-red-400">
              {result.processing_time_sequential.toFixed(3)}s
            </span>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 animate-pulse-slow" />
            <span className="text-[10px] uppercase text-primary flex items-center gap-1 relative z-10">
              <Zap className="w-3 h-3" /> Parallel
            </span>
            <span className="text-lg font-mono text-primary relative z-10">
              {result.processing_time_parallel.toFixed(3)}s
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
             <span className="text-xs text-muted-foreground">Speedup Factor</span>
             <span className="text-sm font-bold text-accent">
               {result.speedup.toFixed(1)}x Faster
             </span>
        </div>
      </div>
    </Card>
  );
};