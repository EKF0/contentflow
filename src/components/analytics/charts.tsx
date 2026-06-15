'use client';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
}

function BarChart({ data, maxValue: maxProp, height = 200 }: BarChartProps) {
  const maxValue = maxProp ?? Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, i) => {
          const pct = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full justify-end gap-1">
              <span className="text-[11px] font-medium text-[var(--fg-weak)]">{item.value}</span>
              <div
                className="w-full rounded-t-[var(--radius-sm)] transition-all duration-300"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: item.color ?? 'var(--primary)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center text-[11px] text-[var(--fg-muted)] truncate">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

function PieChart({ data, size = 160 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-[12px] text-[var(--fg-muted)]">No data</span>
      </div>
    );
  }

  let cumulative = 0;
  const segments = data.map(d => {
    const start = (cumulative / total) * 360;
    cumulative += d.value;
    const end = (cumulative / total) * 360;
    return { ...d, start, end };
  });

  const gradientParts: string[] = [];
  let angle = 0;
  for (const seg of segments) {
    const nextAngle = angle + (seg.value / total) * 100;
    gradientParts.push(`${seg.color} ${angle}% ${nextAngle}%`);
    angle = nextAngle;
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientParts.join(', ')})`,
        }}
      />
      <div className="flex flex-col gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[var(--fg-weak)]">{d.label}</span>
            <span className="font-medium text-[var(--fg)]">{d.value}</span>
            <span className="text-[var(--fg-muted)]">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

function LineChart({ data, height = 180, color = 'var(--primary)' }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const chartWidth = 100;
  const chartHeight = 100 - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${padding.top + chartHeight} ${linePoints} ${points[points.length - 1].x},${padding.top + chartHeight}`;

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${chartWidth} ${padding.top + chartHeight + padding.bottom}`} style={{ height }} className="w-full">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGrad)" />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--bg)" stroke={color} strokeWidth={1.5} />
        ))}
        {points.map((p, i) => (
          <text key={`l-${i}`} x={p.x} y={padding.top + chartHeight + 12} textAnchor="middle" fontSize={7} fill="var(--fg-muted)">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export { BarChart, PieChart, LineChart };
