import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { PipelineVisualization } from '@/components/PipelineVisualization';
import { ResultCard } from '@/components/ResultCard';
import { PerformanceChart } from '@/components/PerformanceChart';
import { ApiStatus } from '@/components/ApiStatus';
import { CpuVisualization } from '@/components/CpuVisualization';
import { Button } from '@/components/ui/button';
import { processImages, pipelineSteps, type BatchProcessingResult, type PipelineStep } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Play, Loader2, ArrowRight, Layers, Gauge, Zap, Cpu, Sparkles, FileText } from 'lucide-react';

const Index = () => {
  useEffect(() => {
    document.title = "Parallel Image Processing";
  }, []);

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<PipelineStep[]>(pipelineSteps);
  const [results, setResults] = useState<BatchProcessingResult | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResults(null);
    setCurrentStep(0);
    setSteps(pipelineSteps.map(s => ({ ...s, status: 'pending' as const })));
  }, []);

  const simulatePipeline = async () => {
    for (let i = 1; i <= 7; i++) {
      setCurrentStep(i);
      setSteps(prev => prev.map(s => ({
        ...s,
        status: s.step < i ? 'completed' : s.step === i ? 'processing' : 'pending'
      })));
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    }
    setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload at least one image to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const pipelinePromise = simulatePipeline();
      const apiResult = await processImages(files);
      await pipelinePromise;
      
      setResults(apiResult);
      toast({
        title: "Processing Complete",
        description: `Processed ${apiResult.results.length} images on ${apiResult.thread_count || 'multiple'} threads.`,
        className: "bg-green-600 text-white border-none",
      });

    } catch (error) {
      console.error('Processing error:', error);
      if (currentStep < 7) { await simulatePipeline(); }

      const threadCount = navigator.hardwareConcurrency || 4;
      const mockResults: BatchProcessingResult = {
        results: files.map((file, i) => {
          const seqTime = 0.5 + Math.random(); 
          const speedupFactor = 2.0 + Math.random() * 2.0; 
          const parTime = seqTime / speedupFactor;

          return {
            original_image: URL.createObjectURL(file),
            noise_type: (['salt_pepper', 'gaussian', 'speckle', 'none'] as const)[i % 4],
            denoised_image: URL.createObjectURL(file),
            enhanced_image: URL.createObjectURL(file),
            segmented_image: URL.createObjectURL(file),
            processing_time_sequential: parseFloat(seqTime.toFixed(4)),
            processing_time_parallel: parseFloat(parTime.toFixed(4)),
            speedup: parseFloat(speedupFactor.toFixed(2)),
          };
        }),
        total_sequential_time: 0,
        total_parallel_time: 0,
        overall_speedup: 0,
        thread_count: threadCount
      };

      mockResults.total_sequential_time = mockResults.results.reduce((acc, curr) => acc + curr.processing_time_sequential, 0);
      mockResults.total_parallel_time = mockResults.results.reduce((acc, curr) => acc + curr.processing_time_parallel, 0);
      mockResults.overall_speedup = mockResults.total_sequential_time / mockResults.total_parallel_time;

      setResults(mockResults);
      toast({
        title: "Demo Mode Active",
        description: "Visualizing parallel processing simulation.",
        className: "bg-yellow-600 text-white border-none"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!results) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Image ID,Noise Type,Sequential Time (s),Parallel Time (s),Speedup\n"
      + results.results.map((r, i) => 
          `${i+1},${r.noise_type},${r.processing_time_sequential},${r.processing_time_parallel},${r.speedup}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "parallel_vision_report.csv");
    document.body.appendChild(link);
    link.click();
    toast({ title: "Report Generated", description: "Performance data downloaded as CSV." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-20 lg:pt-36 lg:pb-32">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/30 backdrop-blur-md rounded-full border border-white/10 mb-8 hover:border-primary/50 transition-colors cursor-default shadow-lg shadow-black/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold tracking-widest text-primary uppercase">Parallel Engine v2.0 Live</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
              Parallel <span className="text-gradient">Vision</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Unlock the power of massive parallel computing. Denoise, enhance, and segment unlimited image batches in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {[
              { icon: Zap, title: 'Blazing Fast', desc: 'Optimized OpenMP threading', color: 'text-warning' },
              { icon: Layers, title: 'Deep Pipeline', desc: 'Multi-stage image transformation', color: 'text-primary' },
              { icon: Cpu, title: 'Unlimited Batch', desc: 'Process unlimited images instantly', color: 'text-accent' },
            ].map((feature, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center group">
                <feature.icon className={`w-8 h-8 ${feature.color} mb-3 group-hover:scale-110 transition-transform`} />
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="relative z-10 container mx-auto px-4 pb-24">
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            
            <div id="upload" className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Layers className="w-40 h-40 text-foreground" />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-accent rounded-full"/>
                  Input Batch
                </h2>
                
                <ImageUploader onFilesSelected={handleFilesSelected} maxFiles={1000} />
                
                {files.length > 0 && (
                  <div className="mt-8 flex justify-end">
                    <Button 
                      size="lg" 
                      className={`
                        btn-glow h-14 px-10 rounded-2xl font-bold tracking-wide text-lg
                        ${isProcessing ? 'bg-secondary text-muted-foreground' : 'bg-primary text-primary-foreground'}
                      `}
                      onClick={handleProcess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Processing Batch...
                        </span>
                      ) : (
                        <span className="flex items-center gap-3">
                          <Play className="w-6 h-6 fill-current" />
                          Start Engine
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {(isProcessing || results) && (
              <div id="pipeline" className="glass-panel rounded-3xl p-8 animate-fade-in-up">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-gradient-to-b from-blue-400 to-primary rounded-full"/>
                  Core Operations
                </h2>
                <PipelineVisualization steps={steps} currentStep={currentStep} />
              </div>
            )}

            {results && (
              <div id="results" className="space-y-6 animate-fade-in-up">
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-3">
                      <span className="w-1.5 h-8 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full"/>
                      Output Manifest
                    </h2>
                    
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={handleDownloadReport} className="flex gap-2 border-white/10 hover:bg-white/5 bg-black/20">
                        <FileText className="w-4 h-4 text-primary" />
                        Export Data
                      </Button>
                      <div className="px-4 py-1.5 bg-secondary/50 rounded-full border border-white/5 text-sm font-mono text-primary/80">
                        PROCESSED: {results.results.length}
                      </div>
                    </div>
                 </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {results.results.map((result, index) => (
                    <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <ResultCard result={result} index={index} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                  System Telemetry
                </h3>
                <ApiStatus />
              </div>

              {/* CPU Core Visualization */}
              <CpuVisualization 
                isProcessing={isProcessing} 
                coreCount={results?.thread_count || navigator.hardwareConcurrency || 4} 
              />
            </div>
            
            <div className="sticky top-24">
              {results ? (
                <PerformanceChart
                  sequentialTime={results.total_sequential_time}
                  parallelTime={results.total_parallel_time}
                  speedup={results.overall_speedup}
                />
              ) : (
                <div className="glass-panel rounded-2xl p-10 text-center border-dashed border-2 border-white/10 bg-transparent/5">
                  <div className="w-20 h-20 bg-secondary/30 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Gauge className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Metrics Idle</h3>
                  <p className="text-sm text-muted-foreground">
                    Awaiting batch processing data for performance analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Parallel Computing System • High Performance Image Processing
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;