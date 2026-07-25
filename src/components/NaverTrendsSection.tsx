"use client";

import { useEffect, useMemo, useState } from "react";
import TrendLineChart, { type TrendMarker, type TrendSeries } from "./TrendLineChart";
import { getTopicMarkersInRange } from "@/lib/seasonalTopics";
import type { NaverTrendResult, TrendDays, TrendTimeUnit } from "@/lib/naverDatalab";
import { ALLOWED_TREND_DAYS } from "@/lib/naverDatalab";

// dataviz 스킬의 검증된 카테고리 팔레트(slot 1~8)를 키워드 등장 순서에 고정 배정.
// CSS 변수라서 라이트/다크 모드에 맞는 색이 자동으로 선택됩니다.
const SERIES_COLOR_VARS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

function SkeletonState() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-52 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      <div className="h-4 w-1/3 rounded bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );
}

function NotConfiguredState() {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
      <p className="mb-2 font-semibold">⚙️ 설정이 필요합니다</p>
      <p className="mb-2">
        네이버 개발자센터(developers.naver.com)에서 애플리케이션을 등록하고 &quot;데이터랩(검색어트렌드)&quot; API
        사용 설정을 한 뒤, 발급받은 Client ID / Secret을 프로젝트 루트의{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/60">.env.local</code>(또는{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/60">.env</code>) 파일에 입력해주세요.
      </p>
      <pre className="overflow-x-auto rounded bg-amber-100 p-2 text-xs text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
{`NAVER_CLIENT_ID=발급받은_client_id
NAVER_CLIENT_SECRET=발급받은_client_secret`}
      </pre>
      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">키를 입력하고 서버를 재시작하면 자동으로 트렌드가 표시됩니다.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-red-300 bg-red-50 p-5 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
      <p className="mb-2 font-semibold">트렌드 데이터를 가져오지 못했습니다</p>
      <p className="mb-3 break-words">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-neutral-900 dark:text-red-300 dark:hover:bg-red-950/50"
      >
        다시 시도
      </button>
    </div>
  );
}

function ToggleGroup<T extends string | number>({
  options,
  value,
  onChange,
  disabledOptions = [],
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabledOptions?: T[];
}) {
  return (
    <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-800">
      {options.map((opt) => {
        const isDisabled = disabledOptions.includes(opt.value);
        const isActive = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(opt.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white"
                : isDisabled
                  ? "cursor-not-allowed text-neutral-300 dark:text-neutral-600"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function pointDiff(data: { ratio: number }[]): number {
  if (data.length < 2) return 0;
  return data[data.length - 1].ratio - data[0].ratio;
}

function DiffBadge({ diff }: { diff: number }) {
  const rounded = Math.round(diff * 10) / 10;
  if (Math.abs(rounded) < 0.1) {
    return <span className="text-[10px] text-neutral-400">보합</span>;
  }
  const up = rounded > 0;
  return (
    <span
      className={`text-[10px] font-semibold ${
        up ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(rounded).toFixed(1)}p
    </span>
  );
}

function Sparkline({ data, color }: { data: { ratio: number }[]; color: string }) {
  const w = 88;
  const h = 28;
  const max = 100;
  const points = data
    .map((d, i) => {
      const x = data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w;
      const y = h - (d.ratio / max) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" aria-hidden>
      <polyline points={points} fill="none" style={{ stroke: color }} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SummaryCards({
  series,
  highlightedId,
  onSelect,
}: {
  series: TrendSeries[];
  highlightedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {series.map((s) => {
        const latest = s.data[s.data.length - 1]?.ratio ?? 0;
        const diff = pointDiff(s.data);
        const isDimmed = highlightedId != null && highlightedId !== s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(highlightedId === s.id ? null : s.id)}
            className={`rounded-lg border p-2.5 text-left transition-colors ${
              highlightedId === s.id
                ? "border-neutral-400 bg-neutral-50 dark:border-neutral-400 dark:bg-neutral-800"
                : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            } ${isDimmed ? "opacity-50" : ""}`}
          >
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-200">{s.name}</span>
              <DiffBadge diff={diff} />
            </div>
            <Sparkline data={s.data} color={s.color} />
            <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{latest.toFixed(1)}</p>
          </button>
        );
      })}
    </div>
  );
}

function OkState({
  series,
  markers,
  fetchedAt,
  startDate,
  endDate,
}: {
  series: TrendSeries[];
  markers: TrendMarker[];
  fetchedAt: string;
  startDate: string;
  endDate: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const periods = series[0]?.data.map((d) => d.period) ?? [];

  const topKeyword = useMemo(() => {
    if (series.length === 0) return null;
    return series.reduce((best, s) => {
      const latest = s.data[s.data.length - 1]?.ratio ?? 0;
      const bestLatest = best.data[best.data.length - 1]?.ratio ?? 0;
      return latest > bestLatest ? s : best;
    }, series[0]);
  }, [series]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          {startDate} ~ {endDate} · 상대 검색량 지수(최고 구간=100)
        </span>
        <span>업데이트: {new Date(fetchedAt).toLocaleString("ko-KR")}</span>
      </div>

      {topKeyword && (
        <p className="mb-3 text-sm text-neutral-700 dark:text-neutral-200">
          🔥 현재 검색량 1위: <span className="font-semibold">{topKeyword.name}</span>{" "}
          <span className="text-neutral-400 dark:text-neutral-500">
            ({(topKeyword.data[topKeyword.data.length - 1]?.ratio ?? 0).toFixed(1)})
          </span>
        </p>
      )}

      <SummaryCards series={series} highlightedId={highlightedId} onSelect={setHighlightedId} />

      <TrendLineChart series={series} markers={markers} highlightedId={highlightedId} />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {series.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setHighlightedId(highlightedId === s.id ? null : s.id)}
            aria-pressed={highlightedId === s.id}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors ${
              highlightedId === s.id
                ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-400 dark:bg-neutral-700 dark:text-white"
                : "border-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            } ${highlightedId != null && highlightedId !== s.id ? "opacity-50" : ""}`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {showTable ? "표 숨기기" : "표로 보기"}
        </button>
      </div>
      {highlightedId && (
        <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
          범례를 다시 누르면 전체 키워드가 다시 보입니다.
        </p>
      )}

      {showTable && (
        <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead className="sticky top-0 bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              <tr>
                <th className="border-b border-neutral-200 px-2 py-1.5 text-left dark:border-neutral-700">날짜</th>
                {series.map((s) => (
                  <th key={s.id} className="border-b border-neutral-200 px-2 py-1.5 text-right dark:border-neutral-700">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p} className="odd:bg-white even:bg-neutral-50/50 dark:odd:bg-neutral-900 dark:even:bg-neutral-800/50">
                  <td className="px-2 py-1 text-neutral-500 dark:text-neutral-400">{p}</td>
                  {series.map((s) => (
                    <td key={s.id} className="px-2 py-1 text-right text-neutral-700 dark:text-neutral-200">
                      {s.data[i].ratio.toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function NaverTrendsSection({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const [days, setDays] = useState<TrendDays>(30);
  const [timeUnitPref, setTimeUnitPref] = useState<TrendTimeUnit>("date");
  const [result, setResult] = useState<NaverTrendResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  // 7일 구간에서는 주간 집계가 의미 없으므로, 사용자가 이전에 "주별"을 선택했더라도
  // 렌더링 시점에 실제로 쓰일 값만 일별로 되돌린다 (state를 effect에서 고치지 않음).
  const timeUnit: TrendTimeUnit = days === 7 ? "date" : timeUnitPref;

  useEffect(() => {
    let ignore = false;
    // 파라미터가 바뀔 때마다 로딩 스피너를 보여주기 위한 표준 fetch-on-change 패턴입니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/naver-trends?days=${days}&unit=${timeUnit}`, { cache: "no-store" });
        const data = (await res.json()) as NaverTrendResult;
        if (!ignore) setResult(data);
      } catch {
        if (!ignore) {
          setResult({ status: "error", message: "네트워크 오류로 트렌드 데이터를 불러오지 못했습니다." });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [days, timeUnit, reloadToken, refreshSignal]);

  const series: TrendSeries[] =
    result?.status === "ok"
      ? result.series.map((s, i) => ({
          id: s.keyword,
          name: s.keyword,
          color: SERIES_COLOR_VARS[i % SERIES_COLOR_VARS.length],
          data: s.data,
        }))
      : [];

  const markers = result?.status === "ok" ? getTopicMarkersInRange(result.startDate, result.endDate) : [];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">🔍 네이버 데이터랩 검색어 트렌드</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            한복 · 전통혼례 · 궁중의상 · 웨딩한복 · 한복대여 · 혼주한복 · 한복모델선발대회 · 한복패션쇼
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={days}
            onChange={setDays}
            options={ALLOWED_TREND_DAYS.map((d) => ({ value: d, label: `${d}일` }))}
          />
          <ToggleGroup
            value={timeUnit}
            onChange={setTimeUnitPref}
            options={[
              { value: "date", label: "일별" },
              { value: "week", label: "주별" },
            ]}
            disabledOptions={days === 7 ? ["week"] : []}
          />
        </div>
      </div>

      {loading && <SkeletonState />}
      {!loading && result?.status === "not_configured" && <NotConfiguredState />}
      {!loading && result?.status === "error" && (
        <ErrorState message={result.message} onRetry={() => setReloadToken((t) => t + 1)} />
      )}
      {!loading && result?.status === "ok" && (
        <OkState series={series} markers={markers} fetchedAt={result.fetchedAt} startDate={result.startDate} endDate={result.endDate} />
      )}
    </section>
  );
}
