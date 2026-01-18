import { useEffect, useState } from 'react';
import { healthCheck, API_BASE_URL } from '@/lib/api';
// import { cn } from '@/lib/utils'; // No longer needed if we remove the badge
import { CheckCircle2, XCircle, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define props to pass status up to parent
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
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Backend Connection</h3>
      </div>

      <div className="space-y-4">
        {/* Main Status Row */}
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
          
          {/* --- REMOVED THE BADGE SECTION HERE AS REQUESTED --- */}
          
        </div>

        {status === 'disconnected' && (
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
            <p className="text-sm text-warning mb-2 font-medium">Backend not reachable</p>
            <p className="text-xs text-muted-foreground">
              Make sure your Python backend <br/>is running at<br/>
                 <code className="font-mono bg-secondary">{API_BASE_URL}</code>
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            updateStatus('checking'); // Use wrapper to update parent too
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