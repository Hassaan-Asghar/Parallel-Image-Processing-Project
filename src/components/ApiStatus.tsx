import { useEffect, useState } from 'react';
import { healthCheck, API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ApiStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await healthCheck();
      setStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Backend Connection</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-3">
            {status === 'checking' && (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            )}
            {status === 'connected' && (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
            {status === 'disconnected' && (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Python Backend</p>
              <p className="text-xs text-muted-foreground font-mono">{API_BASE_URL}</p>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            status === 'connected' && "bg-success/10 text-success",
            status === 'disconnected' && "bg-destructive/10 text-destructive",
            status === 'checking' && "bg-muted text-muted-foreground"
          )}>
            {status === 'checking' ? 'Checking...' : status === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {status === 'disconnected' && (
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
            <p className="text-sm text-warning mb-2 font-medium">Backend not reachable</p>
            <p className="text-xs text-muted-foreground">
              Make sure your Python backend is running at <code className="font-mono bg-secondary px-1 rounded">{API_BASE_URL}</code>
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setStatus('checking');
            healthCheck().then(connected => 
              setStatus(connected ? 'connected' : 'disconnected')
            );
          }}
        >
          Refresh Connection
        </Button>
      </div>
    </div>
  );
}
