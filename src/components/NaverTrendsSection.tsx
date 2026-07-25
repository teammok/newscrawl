"use client";

import { useCallback, useEffect, useState } from "react";
import TrendLineChart, { type TrendSeries } from "./TrendLineChart";
import type { NaverTrendResult } from "@/lib/naverDatalab";

// dataviz 스킬의 검증된 카테고리 팔레트(slot 1~5)를 키워드 등장 순서에 고정 배정
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

function SkeletonState() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-52 rounded-lg bg-neutral-100" />
      <div className="h-4 w-1/3 rounded bg-neutral-100" />
    </div>
  );
}

function NotConfiguredState() {
  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
      <p className="mb-2 font-semibold">⚙️ 설정이 필요합니다</p>
      <p className="mb-2">
        네이버 개발자센터(developers.naver.com)에서 애플리케이션을 등록하고 &quot;데이터랩(검색어트렌드)&quot; API
        사용 설정을 한 뒤, 발급받은 Client ID / Secret을 프로젝트 루트의{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5">.env</code> 파일에 입력해주세요.
      </p>
      <pre className="overflow-x-auto rounded bg-amber-100 p-2 text-xs text-amber-900">
{`NAVER_CLIENT_ID=발급받은_client_id
NAVER_CLIENT_SECRET=발급받은_client_secret`}
      </pre>
      <p className="mt-2 text-xs text-amber-700">키를 입력하고 서버를 재시작하면 자동으로 트렌드가 표시됩니다.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-red-300 bg-red-50 p-5 text-sm text-red-700">
      <p className="mb-2 font-semibold">트렌드 데이터를 가져오지 못했습니다</p>
      <p className="mb-3 break-words">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
      >
        다시 시도
      </button>
    </div>
  );
}

function OkState({
  series,
  fetchedAt,
  startDate,
  endDate,
}: {
  series: TrendSeries[];
  fetchedAt: string;
  startDate: string;
  endDate: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const periods = series[0]?.data.map((d) => d.period) ?? [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <span>
          {startDate} ~ {endDate} · 상대 검색량 지수(최고 구간=100)
        </span>
        <span>업데이트: {new Date(fetchedAt).toLocaleString("ko-KR")}</span>
      </div>

      <TrendLineChart series={series} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          {showTable ? "표 숨기기" : "표로 보기"}
        </button>
      </div>

      {showTable && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-neutral-200">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="border-b border-neutral-200 px-2 py-1.5 text-left">날짜</th>
                {series.map((s) => (
                  <th key={s.id} className="border-b border-neutral-200 px-2 py-1.5 text-right">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p} className="odd:bg-white even:bg-neutral-50/50">
                  <td className="px-2 py-1 text-neutral-500">{p}</td>
                  {series.map((s) => (
                    <td key={s.id} className="px-2 py-1 text-right text-neutral-700">
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

export default function NaverTrendsSection() {
  const [result, setResult] = useState<NaverTrendResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const res = await fetch("/api/naver-trends", { cache: "no-store" });
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
  }, [reloadToken]);

  const load = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  const series: TrendSeries[] =
    result?.status === "ok"
      ? result.series.map((s, i) => ({
          id: s.keyword,
          name: s.keyword,
          color: SERIES_COLORS[i % SERIES_COLORS.length],
          data: s.data,
        }))
      : [];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-neutral-900">🔍 네이버 데이터랩 검색어 트렌드</h2>
        <span className="text-xs text-neutral-400">최근 90일 · 한복 / 전통혼례 / 궁중의상 / 웨딩한복 / 한복대여</span>
      </div>

      {loading && <SkeletonState />}
      {!loading && result?.status === "not_configured" && <NotConfiguredState />}
      {!loading && result?.status === "error" && <ErrorState message={result.message} onRetry={load} />}
      {!loading && result?.status === "ok" && (
        <OkState series={series} fetchedAt={result.fetchedAt} startDate={result.startDate} endDate={result.endDate} />
      )}
    </section>
  );
}
