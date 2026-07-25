"use client";

import { useRef, useState, type PointerEvent } from "react";

export interface TrendSeries {
  id: string;
  name: string;
  color: string;
  data: { period: string; ratio: number }[];
}

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 12, bottom: 26, left: 30 };
const GRID_VALUES = [0, 25, 50, 75, 100];

export default function TrendLineChart({ series }: { series: TrendSeries[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const periods = series[0]?.data.map((d) => d.period) ?? [];
  const n = periods.length;
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (i: number) => PADDING.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yFor = (v: number) => PADDING.top + plotH - (v / 100) * plotH;

  const linePath = (data: { ratio: number }[]) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(d.ratio).toFixed(2)}`).join(" ");

  function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relX - PADDING.left) / plotW;
    const idx = Math.round(ratio * (n - 1));
    setHoverIndex(Math.min(Math.max(idx, 0), n - 1));
  }

  const tickEvery = Math.max(1, Math.ceil(n / 6));
  const hoverLeftPct = hoverIndex !== null ? (xFor(hoverIndex) / WIDTH) * 100 : 0;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label="키워드별 검색어 트렌드 라인 차트"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {GRID_VALUES.map((v) => (
          <g key={v}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
            <text x={PADDING.left - 6} y={yFor(v) + 3} fontSize={9} fill="#898781" textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {periods.map((p, i) =>
          i % tickEvery === 0 ? (
            <text key={p} x={xFor(i)} y={HEIGHT - 8} fontSize={9} fill="#898781" textAnchor="middle">
              {p.slice(5)}
            </text>
          ) : null
        )}

        {series.map((s) => (
          <path
            key={s.id}
            d={linePath(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            stroke="#c3c2b7"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {hoverIndex !== null &&
          series.map((s) => (
            <circle
              key={s.id}
              cx={xFor(hoverIndex)}
              cy={yFor(s.data[hoverIndex].ratio)}
              r={3.5}
              fill={s.color}
              stroke="#fcfcfb"
              strokeWidth={1.5}
            />
          ))}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[9rem] -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{ left: `${Math.min(Math.max(hoverLeftPct, 12), 88)}%` }}
        >
          <p className="mb-1 font-semibold text-neutral-700">{periods[hoverIndex]}</p>
          {series.map((s) => (
            <p key={s.id} className="flex items-center gap-1.5 text-neutral-600">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
              <span className="ml-auto font-medium text-neutral-800">
                {s.data[hoverIndex].ratio.toFixed(1)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
