import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { LandingPipeline } from "@/components/LandingPipeline";
import { ApiStatus } from "@/components/ApiStatus";
import { 
  ArrowRight, Zap, Timer, Settings, Wand2, CheckCircle2, 
  Activity, Cpu, Server
} from "lucide-react";

const Index = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  return (
    <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden selection:bg-cyan-500/30 font-sans">
      <Header />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <main className="relative z-10">
        
        {/* ================= HERO SECTION ================= */}
        <section className="container mx-auto px-4 pt-24 pb-12">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-8">
            
            {/* Left Side: Text */}
            <div className="text-center md:text-left space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-widest text-cyan-300 animate-fade-in-up backdrop-blur-md shadow-[0_0_15px_-3px_rgba(34,211,238,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
                High Performance Engine
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] animate-fade-in-up delay-100 drop-shadow-2xl">
                Parallel <br className="md:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400">
                  Image Processing
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed animate-fade-in-up delay-200 font-light mx-auto md:mx-0">
                A distributed architecture for batch image operations. 
                Benchmark <strong className="text-cyan-100">Serial vs. Parallel</strong> throughput in real-time.
              </p>

              <div className="pt-4 animate-fade-in-up delay-300">
                <Link to="/dashboard">
                  <Button size="lg" className="h-12 md:h-14 w-auto px-8 md:px-10 text-sm md:text-base rounded-full bg-white text-black hover:bg-cyan-50 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all gap-2 font-bold tracking-wide">
                    INITIALIZE SYSTEM <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side: Backend HUD */}
            <div className="w-full max-w-lg animate-fade-in-up delay-200 flex-shrink-0">
              <div className="w-full">
                
                <div className="flex flex-col bg-gradient-to-b from-slate-900 to-[#050505] border border-slate-700/50 rounded-2xl p-5 shadow-2xl hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] transition-all cursor-default relative overflow-hidden group">
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="flex items-center justify-between relative z-10 mb-4 border-b border-white/5 pb-3">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Status</span>
                     
                     {backendStatus === 'connected' ? (
                       <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Connected</span>
                       </div>
                     ) : backendStatus === 'disconnected' ? (
                       <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 shadow-[0_0_10px_-2px_rgba(239,68,68,0.3)]">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </div>
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Disconnected</span>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)]">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Checking...</span>
                       </div>
                     )}
                  </div>

                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <div className="bg-black/40 p-3 rounded-xl text-cyan-400 border border-cyan-900/30 shadow-inner flex-shrink-0 group-hover:text-cyan-300 transition-colors">
                      <Server className="w-6 h-6" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                       <div className="w-full overflow-x-auto no-scrollbar">
                          <div className="scale-100 origin-left whitespace-nowrap">
                             <ApiStatus onStatusChange={setBackendStatus} /> 
                          </div>
                       </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= EXECUTION MODES ================= */}
        <section id="modes" className="container mx-auto px-4 py-16 border-t border-white/5 scroll-mt-24">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-6 shadow-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
              Modes
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Execution Protocols</h2>
            <p className="text-slate-400">Select your processing strategy</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            <div className="group relative bg-gradient-to-br from-slate-900 via-[#0B0B0F] to-black border border-slate-800 p-8 md:p-10 rounded-3xl transition-all duration-300 hover:border-blue-500/60 hover:shadow-[0_0_50px_-15px_rgba(59,130,246,0.2)]">
              <div className="absolute top-8 right-8 p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all border border-blue-500/10">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">Auto Pilot</h3>
              <p className="text-slate-400 mb-8 leading-relaxed h-auto md:h-20 text-sm md:text-base group-hover:text-slate-300 transition-colors">
                AI-driven analysis. Automatically detects noise density (MAD) and histogram distribution to apply optimal filter chains without user intervention.
              </p>
              <div className="border-t border-white/5 pt-6 group-hover:border-blue-500/20 transition-colors">
                 <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> <span>Smart Thresholding</span>
                 </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-900 via-[#0B0B0F] to-black border border-slate-800 p-8 md:p-10 rounded-3xl transition-all duration-300 hover:border-purple-500/60 hover:shadow-[0_0_50px_-15px_rgba(168,85,247,0.2)]">
              <div className="absolute top-8 right-8 p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all border border-purple-500/10">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">Manual Override</h3>
              <p className="text-slate-400 mb-8 leading-relaxed h-auto md:h-20 text-sm md:text-base group-hover:text-slate-300 transition-colors">
                Granular control over the pipeline. Explicitly select algorithms for Denoising (Gaussian/Median) and Segmentation (Otsu/GrabCut).
              </p>
              <div className="border-t border-white/5 pt-6 group-hover:border-purple-500/20 transition-colors">
                 <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" /> <span>Full Parameter Access</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BENCHMARKS ================= */}
        <section id="benchmarks" className="py-16 relative overflow-hidden border-t border-white/5 scroll-mt-24">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-[100px] rounded-full z-0"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/30 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-6 shadow-glow">
                 <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></span>
                 Metrics
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">System Benchmarks</h2>
              <p className="text-slate-400">Live performance metrics from distributed workloads</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-12 max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-slate-900/50 to-black/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-900/80 hover:border-cyan-500/30 transition-all duration-300 group backdrop-blur-sm">
                 <div className="flex items-center justify-between mb-8">
                    <Activity className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-2 py-1 rounded uppercase">Avg Gain</span>
                 </div>
                 <div className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter group-hover:text-cyan-100 transition-colors">4.2x</div>
                 <p className="text-slate-500 text-sm group-hover:text-slate-400">Faster than serial execution</p>
              </div>

              <div className="bg-gradient-to-br from-slate-900/50 to-black/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-900/80 hover:border-purple-500/30 transition-all duration-300 group backdrop-blur-sm">
                 <div className="flex items-center justify-between mb-8">
                    <Timer className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-950/30 border border-purple-500/20 px-2 py-1 rounded uppercase">Latency</span>
                 </div>
                 <div className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter group-hover:text-purple-100 transition-colors">-75%</div>
                 <p className="text-slate-500 text-sm group-hover:text-slate-400">Reduction in processing time</p>
              </div>

               <div className="bg-gradient-to-br from-slate-900/50 to-black/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-900/80 hover:border-emerald-500/30 transition-all duration-300 group backdrop-blur-sm">
                 <div className="flex items-center justify-between mb-8">
                    <Cpu className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded uppercase">Cores</span>
                 </div>
                 <div className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter group-hover:text-emerald-100 transition-colors">100%</div>
                 <p className="text-slate-500 text-sm group-hover:text-slate-400">Thread pool saturation</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 relative z-10 max-w-5xl mx-auto">
               <div className="flex gap-6 p-8 rounded-3xl bg-gradient-to-r from-slate-900/30 to-black border border-slate-800 hover:border-red-500/40 hover:bg-slate-900/50 transition-all duration-300">
                  <div className="p-4 bg-black rounded-2xl h-fit border border-slate-800 shadow-lg">
                    <Timer className="w-8 h-8 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white mb-2">Serial Mode</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      Standard synchronous processing. Each image queues behind the previous one, utilizing only a single logical core.
                    </p>
                  </div>
               </div>

               <div className="flex gap-6 p-8 rounded-3xl bg-gradient-to-r from-slate-900/30 to-black border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/50 transition-all duration-300">
                  <div className="p-4 bg-black rounded-2xl h-fit border border-slate-800 shadow-lg">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white mb-2">Parallel Mode</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      Distributed processing via <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-white">ThreadPoolExecutor</code>. 
                      Images are mapped across all available threads simultaneously.
                    </p>
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* ================= PIPELINE ================= */}
        <section id="pipeline" className="container mx-auto px-4 py-16 border-t border-white/5 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-6 shadow-glow">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
               Pipeline
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Architecture Visualization</h2>
            <p className="text-slate-400 text-center max-w-xl mx-auto">
              Our advanced 5-stage pipeline ensures every image is cleaned, enhanced, segmented, and analyzed with maximum efficiency.
            </p>
          </div>
          
          {/* UPDATED PIPELINE BLOCK BACKGROUND */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0B0B0F] to-black border border-slate-800 rounded-[2.5rem] p-6 md:p-12 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] max-w-6xl mx-auto hover:border-emerald-500/40 hover:shadow-[0_0_50px_-15px_rgba(16,185,129,0.15)] transition-all duration-300">
            <LandingPipeline />
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      {/* UPDATED FOOTER BACKGROUND */}
      <footer className="border-t border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black py-12 mt-12 backdrop-blur-3xl relative overflow-hidden">
        {/* Top Glow for Header-like effect */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        
        <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
          
          <div className="flex items-center justify-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(8,145,178,0.5)]">
               <Cpu className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-2xl tracking-tight text-white">ParallelVision</span>
          </div>

          <p className="text-slate-500 text-sm font-medium">
            © 2025 ParallelVision. All rights reserved. <br className="md:hidden" />
            Parallel and Distributed Computing Project.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Index;