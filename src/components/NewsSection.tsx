"use client";

import { useEffect, useState } from "react";
import type { NaverNewsResult, NewsKeywordGroup } from "@/lib/naverNews";

function SkeletonState() {
  return (
    <div className="animate-pulse space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      ))}
    </div>
  );
}

function ArticleRow({ article }: { article: NewsKeywordGroup["articles"][number] }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
    >
      <p className="text-sm font-medium text-neutral-800 line-clamp-1 dark:text-neutral-100">{article.title}</p>
      {article.description && (
        <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1 dark:text-neutral-400">{article.description}</p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
        {article.press && <span>{article.press}</span>}
        {article.press && article.publishedLabel && <span>·</span>}
        {article.publishedLabel && <span>{article.publishedLabel}</span>}
      </p>
    </a>
  );
}

function KeywordGroupCard({ group }: { group: NewsKeywordGroup }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        &quot;{group.keyword}&quot; 관련 기사
      </h3>

      {group.status === "error" && (
        <p className="rounded-lg border border-dashed border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
          가져오기 실패{group.message ? `: ${group.message}` : ""}
        </p>
      )}

      {group.status === "ok" && group.articles.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 p-3 text-xs text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
          오늘은 관련 기사 없음
        </p>
      )}

      {group.status === "ok" && group.articles.length > 0 && (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {group.articles.map((article) => (
            <ArticleRow key={article.url} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsSection() {
  const [result, setResult] = useState<NaverNewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;
    // 새로고침 버튼/최초 로드 시 로딩 상태를 보여주기 위한 표준 fetch-on-change 패턴입니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/naver-news", { cache: "no-store" });
        const data = (await res.json()) as NaverNewsResult;
        if (!ignore) setResult(data);
      } catch {
        if (!ignore) setResult({ groups: [], fetchedAt: new Date().toISOString() });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const allFailed = result != null && result.groups.length > 0 && result.groups.every((g) => g.status === "error");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">📰 한복 키워드 뉴스</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">한복 · 전통의상 · 궁중문화 최신 검색 결과</p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              업데이트: {new Date(result.fetchedAt).toLocaleString("ko-KR")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadToken((t) => t + 1)}
            disabled={loading}
            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>
      </div>

      {loading && <SkeletonState />}

      {!loading && allFailed && (
        <p className="mb-3 rounded-lg border border-dashed border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
          모든 키워드의 뉴스를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {result.groups.map((group) => (
            <KeywordGroupCard key={group.keyword} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}
