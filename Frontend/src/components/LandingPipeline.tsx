import { Upload, Sparkles, Wand2, Scissors, FileOutput, ArrowDown } from "lucide-react";

export const LandingPipeline = () => {
  const steps = [
    { icon: <Upload className="w-5 h-5" />, label: "Upload", color: "text-blue-400" },
    { icon: <Sparkles className="w-5 h-5" />, label: "Denoise", color: "text-yellow-400" },
    { icon: <Wand2 className="w-5 h-5" />, label: "Enhance", color: "text-purple-400" },
    { icon: <Scissors className="w-5 h-5" />, label: "Segment", color: "text-pink-400" },
    { icon: <FileOutput className="w-5 h-5" />, label: "Output", color: "text-green-400" },
  ];

  return (
    <div className="w-full py-8 relative">
      {/* --- DESKTOP VIEW (Horizontal) --- */}
      <div className="hidden md:flex justify-between items-center relative max-w-5xl mx-auto px-10">
        
        {/* Animated Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent -translate-y-1/2 z-0 blur-[1px]"></div>
        
        {steps.map((step, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center group cursor-default">
            
            {/* Glowing Icon Circle */}
            <div className={`
              w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/10 
              flex items-center justify-center relative
              group-hover:border-white/30 group-hover:-translate-y-2 transition-all duration-500 ease-out
              shadow-[0_0_0_1px_rgba(0,0,0,1)]
            `}>
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className={`${step.color} relative z-10`}>
                {step.icon}
              </div>
            </div>

            {/* Label with "Step Number" */}
            <div className="absolute -bottom-12 w-32 text-center opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Step 0{idx + 1}</div>
              <h4 className="font-bold text-white text-sm tracking-wide">
                {step.label}
              </h4>
            </div>

            {/* Connection Dots */}
            {idx < steps.length - 1 && (
               <div className="absolute top-1/2 -right-[50%] w-1.5 h-1.5 bg-cyan-500 rounded-full -translate-y-1/2 shadow-[0_0_10px_cyan] z-10" />
            )}
          </div>
        ))}
      </div>

      {/* --- MOBILE VIEW (Vertical with connect lines) --- */}
      <div className="md:hidden flex flex-col items-center space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center">
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 w-64 backdrop-blur-md relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                <div className={`w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/10 ${step.color}`}>
                  {step.icon}
                </div>
                <div>
                   <div className="text-[10px] text-gray-500 font-mono uppercase">Step 0{idx + 1}</div>
                   <h4 className="font-bold text-white tracking-wide">{step.label}</h4>
                </div>
            </div>
            {/* Arrow connecting items */}
            {idx < steps.length - 1 && (
              <div className="h-6 w-px bg-white/10 my-1 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/20 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};