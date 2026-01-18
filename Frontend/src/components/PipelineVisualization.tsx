import { cn } from '@/lib/utils';
import { Check, Loader2, Clock, AlertCircle } from 'lucide-react';

interface PipelineStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

interface PipelineVisualizationProps {
  steps: PipelineStep[];
  currentStep: number;
}

export function PipelineVisualization({ steps, currentStep }: PipelineVisualizationProps) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Processing Pipeline</h3>
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        <div 
          className="absolute left-6 top-0 w-0.5 bg-primary transition-all duration-500"
          style={{ 
            height: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%` 
          }}
        />
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = step.step === currentStep;
            const isCompleted = step.step < currentStep;
            const isPending = step.step > currentStep;
            
            return (
              <div
                key={step.step}
                className={cn(
                  "relative flex items-start gap-4 pl-12 transition-all duration-300",
                  isActive && "scale-[1.02]"
                )}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    "absolute left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                    isPending && "bg-secondary text-muted-foreground",
                    step.status === 'error' && "bg-destructive text-destructive-foreground"
                  )}
                >
                  {isCompleted && <Check className="w-3 h-3" />}
                  {isActive && step.status === 'processing' && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  {isPending && <Clock className="w-3 h-3" />}
                  {step.status === 'error' && <AlertCircle className="w-3 h-3" />}
                </div>
                
                {/* Pulse ring for active step */}
                {isActive && step.status === 'processing' && (
                  <div className="absolute left-3 w-6 h-6 rounded-full bg-primary animate-pulse-ring" />
                )}
                
                {/* Step content */}
                <div
                  className={cn(
                    "flex-1 p-4 rounded-xl transition-all duration-300",
                    isCompleted && "bg-primary/5 border border-primary/20",
                    isActive && "bg-primary/10 border border-primary/40 shadow-lg shadow-primary/10",
                    isPending && "bg-secondary/50 border border-border",
                    step.status === 'error' && "bg-destructive/10 border border-destructive/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        "font-medium transition-colors",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {step.name}
                    </h4>
                    <span className="text-xs font-mono text-muted-foreground">
                      Step {step.step}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
