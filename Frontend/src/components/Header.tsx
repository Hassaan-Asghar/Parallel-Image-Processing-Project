import { Link, useLocation } from "react-router-dom";
import { Cpu, Zap, Activity, GitGraph, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-gradient-to-b from-[#0B0B10]/90 to-[#020202]/90 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"></div>

      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
        
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(8,145,178,0.4)] group-hover:shadow-[0_0_20px_-3px_rgba(8,145,178,0.6)] transition-all">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0B0B10]">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">ParallelVision</h1>
            <p className="text-xs text-slate-400 font-mono group-hover:text-cyan-400 transition-colors">Parallel Image Processing</p>
          </div>
        </Link>

        {isHome && (
          <nav className="hidden md:flex items-center bg-slate-900/50 rounded-full px-2 p-1 border border-white/10 ml-auto backdrop-blur-sm shadow-lg">
            <button 
              onClick={() => scrollToSection('modes')} 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <Settings className="w-3.5 h-3.5" /> Modes
            </button>
            <button 
              onClick={() => scrollToSection('benchmarks')} 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <Activity className="w-3.5 h-3.5" /> Benchmarks
            </button>
            <button 
              onClick={() => scrollToSection('pipeline')} 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <GitGraph className="w-3.5 h-3.5" /> Pipeline
            </button>
          </nav>
        )}

        {isHome && (
          <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        )}

        {isHome && isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-gradient-to-b from-[#0B0B10] to-black border-b border-slate-800 backdrop-blur-xl p-4 md:hidden flex flex-col gap-2 z-50 shadow-2xl">
            <button onClick={() => scrollToSection('modes')} className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-cyan-400 rounded-lg transition-colors border border-transparent hover:border-white/5">
              <Settings className="w-4 h-4" /> Modes
            </button>
            <button onClick={() => scrollToSection('benchmarks')} className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-purple-400 rounded-lg transition-colors border border-transparent hover:border-white/5">
              <Activity className="w-4 h-4" /> Benchmarks
            </button>
            <button onClick={() => scrollToSection('pipeline')} className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-white/5">
              <GitGraph className="w-4 h-4" /> Pipeline
            </button>
          </div>
        )}
      </div>
    </header>
  );
}