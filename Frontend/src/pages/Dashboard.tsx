import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { AdvancedControls } from '@/components/AdvancedControls';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, Zap, Layers, Timer, Activity, 
  ScanEye, CheckCircle2, MoveHorizontal, FileArchive, Loader2, RotateCcw, Download 
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { processImages, ProcessOptions, BatchResponse } from '@/lib/api'; 

const CompactComparisonSlider = ({ clean, result, filename }: { clean: string, result: string, filename: string }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => setIsResizing(true);
  const handleEnd = () => setIsResizing(false);

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      setSliderPosition(percent);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault(); 
      handleMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      handleMove(e.touches[0].clientX);
    };

    if (isResizing) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isResizing]);

  return (
    <div className="group relative w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-black select-none shadow-2xl touch-none">
      
      <div 
        ref={containerRef}
        className="relative w-full h-full cursor-col-resize touch-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img 
            src={clean} 
            alt="Original" 
            className="w-full h-full object-cover grayscale brightness-110 contrast-105" 
          />
        </div>

        <div 
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ 
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
          }}
        >
           <img 
             src={result} 
             alt="Processed" 
             className="w-full h-full object-cover" 
           />
        </div>

        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-black border border-cyan-500 shadow-lg flex items-center justify-center scale-90 group-hover:scale-110 transition-transform duration-200">
            <MoveHorizontal className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        
        <div className="absolute top-2.5 left-2 px-0.5 py-0.5 bg-red-600/90 backdrop-blur-md rounded text-[8px] md:text-[10px] font-bold tracking-wider text-white shadow-sm pointer-events-none z-30 transition-opacity opacity-0 group-hover:opacity-100">
          PROCESSED
        </div>
        <div className="absolute top-2.5 right-2 px-0.5 py-0.5 bg-slate-900/80 backdrop-blur-md rounded text-[8px] md:text-[10px] font-bold tracking-wider text-slate-300 shadow-sm pointer-events-none z-30 transition-opacity opacity-0 group-hover:opacity-100">
          ORIGINAL
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-end pointer-events-none z-30">
         <span className="text-[10px] text-slate-300 font-mono truncate max-w-[90%]">{filename}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [viewState, setViewState] = useState<'input' | 'processing' | 'results'>('input');
  const [files, setFiles] = useState<File[]>([]);
  const [processedCount, setProcessedCount] = useState(0); 
  const [results, setResults] = useState<BatchResponse | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  
  const [options, setOptions] = useState<ProcessOptions>({
    mode: 'auto',
    noise_mode: 'auto',
    enhance_mode: 'auto',
    segment_mode: 'auto'
  });

  const { toast } = useToast();

  const handleRunAnalysis = async () => {
    if (files.length === 0) {
      toast({ title: "No images", description: "Please upload files first.", variant: "destructive" });
      return;
    }

    setViewState('processing');
    setProcessedCount(0);

    const progressInterval = setInterval(() => {
      setProcessedCount((prev) => {
        if (prev < files.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      const response = await processImages(files, options);
      
      clearInterval(progressInterval);
      setProcessedCount(files.length); 
      
      const formattedResults: BatchResponse = {
        ...response,
        results: response.results.map((r: any) => ({
          enhanced: r.original,    
          segmented: r.processed,  
          filename: r.original.split('/').pop() || "image.png"
        }))
      };

      setResults(formattedResults);

      setTimeout(() => {
        setViewState('results');
        toast({ title: "Analysis Complete", description: "Processing finished successfully." });
      }, 500);

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error(error);
      setViewState('input');
      toast({ 
        title: "Processing Failed", 
        description: error.message || "Could not connect to backend.", 
        variant: "destructive" 
      });
    }
  };

  const handleDownloadZip = async () => {
    if (!results) return;
    setIsZipping(true);
    toast({ title: "Compressing", description: "Preparing images for download..." });
    try {
      const zip = new JSZip();
      const folder = zip.folder(`parallel_results_${results.session_id}`);
      const promises = results.results.map(async (res, index) => {
        const response = await fetch(res.segmented); 
        const blob = await response.blob();
        const name = res.filename || `image_${index}.png`;
        folder?.file(`processed_${name}`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `parallel_vision_results.zip`);
      toast({ title: "Success", description: "Download started." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create zip file.", variant: "destructive" });
    } finally {
      setIsZipping(false);
    }
  };

  const resetDashboard = () => {
    setFiles([]);
    setResults(null);
    setViewState('input');
    setProcessedCount(0);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-cyan-500/30">
      <Header />
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-12 pb-20">
        
        {viewState === 'input' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4 mb-12">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Analysis</span>
              </h1>
              <p className="text-slate-400">Configure your pipeline parameters and upload dataset.</p>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-2 md:p-8 shadow-2xl">
              <Tabs defaultValue="auto" onValueChange={(val) => setOptions(prev => ({...prev, mode: val as 'auto' | 'advanced'}))}>
                <TabsList className="w-full bg-black/50 p-1 rounded-2xl border border-white/5 mb-8 h-auto">
                  <TabsTrigger value="auto" className="w-1/2 py-4 rounded-xl data-[state=active]:bg-cyan-950/30 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20 transition-all">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-5 h-5" /> 
                      <span className="font-bold">Auto Pilot</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="w-1/2 py-4 rounded-xl data-[state=active]:bg-purple-950/30 data-[state=active]:text-purple-400 data-[state=active]:border data-[state=active]:border-purple-500/20 transition-all">
                    <div className="flex flex-col items-center gap-2">
                      <Layers className="w-5 h-5" /> 
                      <span className="font-bold">Manual Override</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-6">
                  <TabsContent value="auto" className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                      <p className="text-cyan-200 text-sm">
                        <Zap className="w-4 h-4 inline mr-2" />
                        System will automatically determine noise thresholds (MAD) and segmentation parameters.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="advanced" className="animate-in fade-in slide-in-from-bottom-2">
                      <div className="p-6 rounded-xl bg-black/40 border border-white/5">
                         <AdvancedControls options={options} setOptions={setOptions} />
                      </div>
                  </TabsContent>
                  <div className="mt-8">
                    <ImageUploader onFilesSelected={setFiles} maxFiles={100} />
                  </div>
                  {files.length > 0 && (
                    <div className="pt-8 flex justify-center">
                      <Button 
                        className="
                          group relative rounded-full overflow-hidden
                          h-12 px-8 text-sm md:h-16 md:px-12 md:text-lg
                          bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 
                          bg-[length:200%_auto] hover:bg-right
                          font-bold tracking-wide text-white
                          shadow-[0_0_30px_-5px_rgba(30,64,175,0.5)] 
                          hover:shadow-[0_0_50px_-10px_rgba(30,64,175,0.8)]
                          transition-all duration-500 ease-out
                          hover:scale-105 active:scale-95 border border-white/10
                        "
                        onClick={handleRunAnalysis}
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out" />
                        <Settings className="relative z-10 mr-3 w-5 h-5 md:w-6 md:h-6 stroke-[2px] transition-colors duration-300 group-hover:animate-spin group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        <span className="relative z-10">START PROCESSING</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        )}

        {viewState === 'processing' && (
          <div className="fixed inset-0 z-50 bg-[#020202]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
              <div className="relative mb-12">
                <div className="w-32 h-32 rounded-full bg-cyan-500/10 flex items-center justify-center animate-pulse border border-cyan-500/20 shadow-[0_0_60px_-15px_rgba(6,182,212,0.5)]">
                   <ScanEye className="w-12 h-12 text-cyan-400 animate-ping-slow" />
                </div>
                <div className="absolute inset-0 border-t-2 border-cyan-500/50 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-blue-500/50 rounded-full animate-spin-reverse"></div>
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">Processing Pipeline Active</h2>
             <div className="flex items-end gap-2 mb-8">
               <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {processedCount > files.length ? files.length : processedCount}
               </span>
               <span className="text-xl text-slate-500 font-bold mb-2">/ {files.length} images</span>
             </div>
             <div className="w-full max-w-md h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
               <div 
                 className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
                 style={{ width: `${(processedCount / files.length) * 100}%` }}
               />
             </div>
             <p className="mt-4 text-slate-400 font-mono text-sm">Running parallel image filters...</p>
          </div>
        )}

        {viewState === 'results' && results && (
          <div className="animate-fade-in-up space-y-12 max-w-[1600px] mx-auto">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-8">
              <div className="w-full">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <CheckCircle2 className="text-green-500 w-8 h-8 flex-shrink-0" />
                  Analysis Complete
                </h2>
                <div className="flex items-center gap-2 mt-3 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                   <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">SESSION ID</span>
                   <code className="text-cyan-300 font-mono text-sm truncate max-w-[120px] md:max-w-xs" title={results.session_id}>
                     {results.session_id}
                   </code>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={resetDashboard} 
                    className="group h-12 border-white/10 hover:bg-white/5 text-slate-300 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-4 h-4 mr-2 transition-transform duration-500 group-hover:-rotate-180" /> 
                    New Analysis
                  </Button>
                  
                  <Button 
                    className="h-12 bg-cyan-600 hover:bg-cyan-500 text-white gap-2 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] w-full sm:w-auto px-6"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                  >
                    {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                    {isZipping ? 'Compressing...' : 'Download Results (ZIP)'}
                  </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-cyan-950/30 to-black border border-cyan-500/30 rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 text-cyan-400">
                       <Zap className="w-5 h-5" />
                       <span className="font-bold uppercase tracking-wider text-xs">Total Speedup</span>
                    </div>
                    <div className="text-7xl font-black text-white tracking-tighter">
                      {results.metrics.speedup}x
                    </div>
                    <p className="text-cyan-200/60 mt-2 text-sm">Performance gain over serial execution</p>
                  </div>
               </div>

               <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-red-500/30 transition-colors">
                  <div className="flex items-center gap-3 text-red-400 mb-4">
                     <Timer className="w-5 h-5" />
                     <span className="font-bold uppercase tracking-wider text-xs">Serial Time</span>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">{results.metrics.serial_time_sec}s</div>
                    <p className="text-slate-500 text-xs">Single-core processing</p>
                  </div>
               </div>

               <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-green-500/30 transition-colors">
                  <div className="flex items-center gap-3 text-green-400 mb-4">
                     <Activity className="w-5 h-5" />
                     <span className="font-bold uppercase tracking-wider text-xs">Parallel Time</span>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">{results.metrics.parallel_time_sec}s</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                        ACTIVE CORES UTILIZED
                      </span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-2xl font-bold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                 <Layers className="w-6 h-6 text-purple-400" /> System Output Visualization
               </h3>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {results.results.map((res, idx) => (
                    <CompactComparisonSlider 
                      key={idx}
                      clean={res.enhanced}
                      result={res.segmented}
                      filename={res.filename}
                    />
                  ))}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;