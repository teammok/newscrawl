"use client";

import { useRef, useState, type PointerEvent } from "react";

export interface TrendSeries {
  id: string;
  name: string;
  /** CSS 색상 값 (예: "var(--series-1)") - 라이트/다크 모드에 따라 자동으로 바뀝니다 */
  color: string;
  data: { period: string; ratio: number }[];
}

export interface TrendMarker {
  date: string;
  label: string;
}

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 34, right: 12, bottom: 26, left: 30 };
const GRID_VALUES = [0, 25, 50, 75, 100];
const MARKER_LABEL_ROW_Y = [12, 24]; // 인접한 마커 레이블이 겹치지 않도록 2단으로 교차 배치

export default function TrendLineChart({
  series,
  markers = [],
  highlightedId = null,
}: {
  series: TrendSeries[];
  markers?: TrendMarker[];
  highlightedId?: string | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const periods = series[0]?.data.map((d) => d.period) ?? [];
  const n = periods.length;
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const xForPeriodIndex = (i: number) => PADDING.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yFor = (v: number) => PADDING.top + plotH - (v / 100) * plotH;

  const xForDate = (date: string): number | null => {
    const idx = periods.indexOf(date);
    if (idx !== -1) return xForPeriodIndex(idx);
    if (n < 2) return null;
    // 주간 집계 등으로 날짜가 정확히 일치하지 않을 때 비례 위치로 근사
    const first = periods[0];
    const last = periods[n - 1];
    if (date < first || date > last) return null;
    const totalMs = new Date(last).getTime() - new Date(first).getTime();
    if (totalMs <= 0) return null;
    const offsetMs = new Date(date).getTime() - new Date(first).getTime();
    return PADDING.left + (offsetMs / totalMs) * plotW;
  };

  const linePath = (data: { ratio: number }[]) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${xForPeriodIndex(i).toFixed(2)} ${yFor(d.ratio).toFixed(2)}`).join(" ");

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
  const hoverLeftPct = hoverIndex !== null ? (xForPeriodIndex(hoverIndex) / WIDTH) * 100 : 0;

  // 강조된 라인이 맨 위에 그려지도록 정렬 (나머지는 원래 순서 유지)
  const orderedSeries =
    highlightedId != null
      ? [...series.filter((s) => s.id !== highlightedId), ...series.filter((s) => s.id === highlightedId)]
      : series;

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
              style={{ stroke: "var(--chart-grid)" }}
              strokeWidth={1}
            />
            <text x={PADDING.left - 6} y={yFor(v) + 3} fontSize={9} style={{ fill: "var(--chart-ink-muted)" }} textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {periods.map((p, i) =>
          i % tickEvery === 0 ? (
            <text
              key={p}
              x={xForPeriodIndex(i)}
              y={HEIGHT - 8}
              fontSize={9}
              style={{ fill: "var(--chart-ink-muted)" }}
              textAnchor="middle"
            >
              {p.slice(5)}
            </text>
          ) : null
        )}

        {markers
          .map((m) => ({ ...m, x: xForDate(m.date) }))
          .filter((m): m is TrendMarker & { x: number } => m.x !== null)
          .sort((a, b) => a.x - b.x)
          .map((m, i) => (
            <g key={`${m.date}-${m.label}`}>
              <line
                x1={m.x}
                x2={m.x}
                y1={PADDING.top}
                y2={HEIGHT - PADDING.bottom}
                style={{ stroke: "var(--series-2)" }}
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeDasharray="2 3"
              />
              <text
                x={m.x}
                y={MARKER_LABEL_ROW_Y[i % 2]}
                fontSize={9}
                fontWeight={600}
                style={{ fill: "var(--series-2)" }}
                textAnchor="middle"
              >
                {m.label}
              </text>
            </g>
          ))}

        {orderedSeries.map((s) => {
          const dimmed = highlightedId != null && s.id !== highlightedId;
          return (
            <path
              key={s.id}
              d={linePath(s.data)}
              fill="none"
              style={{ stroke: s.color }}
              strokeWidth={dimmed ? 1.5 : highlightedId === s.id ? 2.75 : 2}
              strokeOpacity={dimmed ? 0.22 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {hoverIndex !== null && (
          <line
            x1={xForPeriodIndex(hoverIndex)}
            x2={xForPeriodIndex(hoverIndex)}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            style={{ stroke: "var(--chart-baseline)" }}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {hoverIndex !== null &&
          series.map((s) => (
            <circle
              key={s.id}
              cx={xForPeriodIndex(hoverIndex)}
              cy={yFor(s.data[hoverIndex].ratio)}
              r={3.5}
              style={{ fill: s.color, stroke: "var(--chart-surface)" }}
              strokeWidth={1.5}
              opacity={highlightedId != null && s.id !== highlightedId ? 0.3 : 1}
            />
          ))}
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[9rem] -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-800"
          style={{ left: `${Math.min(Math.max(hoverLeftPct, 12), 88)}%` }}
        >
          <p className="mb-1 font-semibold text-neutral-700 dark:text-neutral-200">{periods[hoverIndex]}</p>
          {series.map((s) => (
            <p
              key={s.id}
              className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"
              style={{ opacity: highlightedId != null && s.id !== highlightedId ? 0.4 : 1 }}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
              <span className="ml-auto font-medium text-neutral-800 dark:text-neutral-100">
                {s.data[hoverIndex].ratio.toFixed(1)}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
