import React from 'react';

interface AdvancedControlsProps {
  options: any;
  setOptions: (opts: any) => void;
}

export const AdvancedControls = ({ options, setOptions }: AdvancedControlsProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, key: string) => {
    setOptions((prev: any) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
      {/* Noise Mode */}
      <div className="space-y-2">
        <label className="text-white font-mono text-xs uppercase tracking-wider block">
          Denoising Strategy
        </label>
        <select 
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-3"
          value={options.noise_mode} 
          onChange={(e) => handleChange(e, 'noise_mode')}
        >
          <option value="none">None (Raw)</option>
          <option value="auto">Auto Detect</option>
          <option value="median">Median Filter</option>
          <option value="gaussian">Gaussian Blur</option>
          <option value="bilateral">Bilateral Filter</option>
          <option value="nlm">Non-Local Means (Heavy)</option>
        </select>
      </div>

      {/* Enhance Mode */}
      <div className="space-y-2">
        <label className="text-white font-mono text-xs uppercase tracking-wider block">
          Enhancement
        </label>
        <select 
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-3"
          value={options.enhance_mode} 
          onChange={(e) => handleChange(e, 'enhance_mode')}
        >
          <option value="none">None</option>
          <option value="auto">Auto Enhance</option>
          <option value="clahe">CLAHE (Contrast)</option>
          <option value="gamma">Gamma Correction</option>
          <option value="unsharp">Unsharp Masking</option>
          <option value="hist">Histogram Eq</option>
        </select>
      </div>

      {/* Segment Mode */}
      <div className="space-y-2">
        <label className="text-white font-mono text-xs uppercase tracking-wider block">
          Segmentation
        </label>
        <select 
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-md p-3"
          value={options.segment_mode} 
          onChange={(e) => handleChange(e, 'segment_mode')}
        >
          <option value="none">None</option>
          <option value="auto">Auto (ROI/Tumor)</option>
          <option value="grabcut">GrabCut (Foreground)</option>
        </select>
      </div>
    </div>
  );
};