import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceChartProps {
  sequentialTime: number;
  parallelTime: number;
  speedup: number;
}

export function PerformanceChart({ sequentialTime, parallelTime, speedup }: PerformanceChartProps) {
  const data = [
    {
      name: 'Processing Time',
      Sequential: sequentialTime,
      Parallel: parallelTime,
    },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Comparison</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full border border-success/30">
          <span className="text-sm font-medium text-success">{speedup.toFixed(2)}x Speedup</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(222 30% 18%)" 
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              type="number" 
              stroke="hsl(215 20% 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="hsl(215 20% 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              hide
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 9%)',
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '12px',
                color: 'hsl(210 40% 96%)',
              }}
              formatter={(value: number) => [`${value.toFixed(3)}s`, '']}
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(210 40% 96%)' }}
            />
            <Bar 
              dataKey="Sequential" 
              fill="hsl(280 70% 60%)" 
              radius={[0, 8, 8, 0]}
              name="Sequential Processing"
            />
            <Bar 
              dataKey="Parallel" 
              fill="hsl(174 72% 56%)" 
              radius={[0, 8, 8, 0]}
              name="Parallel Processing"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-accent">{sequentialTime.toFixed(2)}s</p>
          <p className="text-xs text-muted-foreground mt-1">Sequential Time</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-primary">{parallelTime.toFixed(2)}s</p>
          <p className="text-xs text-muted-foreground mt-1">Parallel Time</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-success">{((1 - parallelTime / sequentialTime) * 100).toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Time Saved</p>
        </div>
      </div>
    </div>
  );
}
