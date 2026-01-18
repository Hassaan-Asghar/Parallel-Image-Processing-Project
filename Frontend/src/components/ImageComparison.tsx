import { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  label?: string;
}

export const ImageComparison = ({ beforeImage, afterImage, label }: ImageComparisonProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(Math.max(x, 0), 100));
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize border border-white/10 shadow-2xl group select-none bg-black/40"
         ref={containerRef}
         onMouseDown={handleMouseDown}>
      
      {/* After Image (Background) - NOW USING object-contain */}
      <img 
        src={afterImage} 
        alt="Processed" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
      />
      
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md z-10 border border-white/10">
        Processed
      </div>

      {/* Before Image (Clipped) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black/40" style={{ width: `${position}%` }}>
        {/* NOW USING object-contain AND MATCHING CONTAINER WIDTH */}
        <img 
            src={beforeImage} 
            alt="Original" 
            className="absolute top-0 left-0 h-full max-w-none object-contain pointer-events-none" 
            style={{ width: containerRef.current?.offsetWidth }} 
        />
         <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md z-10 border border-white/10">
            Original {label ? `(${label})` : ''}
         </div>
      </div>

      {/* Slider Handle */}
      <div className="absolute top-0 bottom-0 w-1 bg-primary/80 cursor-ew-resize shadow-[0_0_15px_rgba(0,255,255,0.5)] z-20 backdrop-blur-sm"
           style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 border border-primary/50 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 backdrop-blur-md">
          <MoveHorizontal className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
};