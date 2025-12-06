import { Cpu, Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-success-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ParallelVision</h1>
              <p className="text-xs text-muted-foreground">Parallel Image Processing</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#upload" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Upload
            </a>
            <a href="#pipeline" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Pipeline
            </a>
            <a href="#results" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Results
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground font-mono text-xs">API Ready</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
