import { useEffect, useState } from 'react';
import { healthCheck, API_BASE_URL } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiStatusProps {
  onStatusChange?: (status: 'checking' | 'connected' | 'disconnected') => void;
}

export function ApiStatus({ onStatusChange }: ApiStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const updateStatus = (newStatus: 'checking' | 'connected' | 'disconnected') => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await healthCheck();
      updateStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">Backend Connection</h3>
      </div>

      <div className="space-y-3">
        {/* Main Status Row */}
        <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-white/5">
          <div className="flex-shrink-0 mt-0.5">
            {status === 'checking' && (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            )}
            {status === 'connected' && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {status === 'disconnected' && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground mb-0.5">Python Backend</p>
            {/* 'break-all' ensures long URLs wrap on mobile so the box fits */}
            <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
              {API_BASE_URL}
            </p>
          </div>
        </div>

        {status === 'disconnected' && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400 mb-1 font-medium">Backend not reachable</p>
            <p className="text-xs text-muted-foreground break-all">
              Make sure your backend is running at:
              <br />
              <code className="text-red-300/80 select-all">{API_BASE_URL}</code>
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full h-10 border-white/10 hover:bg-white/5 hover:text-white transition-colors"
          onClick={() => {
            updateStatus('checking');
            healthCheck().then(connected => 
              updateStatus(connected ? 'connected' : 'disconnected')
            );
          }}
        >
          Refresh Connection
        </Button>
      </div>
    </div>
  );
}