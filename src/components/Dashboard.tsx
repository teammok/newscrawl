"use client";

import { useCallback, useState } from "react";
import SeasonalTopicsSection from "./SeasonalTopicsSection";
import NaverTrendsSection from "./NaverTrendsSection";
import NewsSection from "./NewsSection";

export default function Dashboard() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST", cache: "no-store" });
    } catch (err) {
      console.error("[Dashboard] 캐시 무효화 요청 실패 (그래도 재조회는 진행합니다):", err);
    } finally {
      setRefreshSignal((v) => v + 1);
      setLastUpdated(new Date());
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="-mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {lastUpdated
            ? `마지막 전체 업데이트: ${lastUpdated.toLocaleString("ko-KR")}`
            : "뉴스는 매일 아침 자동으로 갱신되고, 검색 트렌드는 항상 최신입니다"}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          {refreshing ? "업데이트 중..." : "🔄 전체 업데이트"}
        </button>
      </div>

      <SeasonalTopicsSection />
      <NaverTrendsSection refreshSignal={refreshSignal} />
      <NewsSection refreshSignal={refreshSignal} />
    </div>
  );
}
