import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="relative z-10 text-center space-y-6 p-8 glass-card rounded-3xl max-w-lg w-full mx-4">
        <div className="relative inline-block">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent select-none">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary font-mono text-xl tracking-[1em] opacity-80">
            LOST
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            The path <code className="px-2 py-0.5 rounded bg-muted text-primary font-mono text-sm">{location.pathname}</code> does not exist in this dimension.
          </p>
        </div>

        <div className="pt-4">
          <a 
            href="/" 
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;