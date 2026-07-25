import SeasonalTopicsSection from "@/components/SeasonalTopicsSection";
import NaverTrendsSection from "@/components/NaverTrendsSection";
import NewsSection from "@/components/NewsSection";

function AttributionBadge() {
  return (
    <div className="fixed top-3 right-3 z-40 max-w-[calc(100vw-1.5rem)] rounded-lg border border-neutral-200 bg-white/90 px-3 py-1.5 text-right text-[10px] leading-snug text-neutral-400 shadow-sm backdrop-blur-sm sm:max-w-[380px] dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-500">
      <p>원본 프롬프트 출처 및 제작자: 잠깐트렌드 (@jamkkan_trend), 1.A컨텐츠랩</p>
      <p>개인 작업용 도구입니다 — 재배포·상업적 이용 금지 원칙을 지켜주세요.</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AttributionBadge />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            한복궁 릴스 소재 트렌드 대시보드
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            인스타그램 릴스 소재 발굴을 위한 시즌 캘린더 · 검색 트렌드 · 뉴스 모음
          </p>
        </header>

        <div className="flex flex-col gap-8">
          <SeasonalTopicsSection />
          <NaverTrendsSection />
          <NewsSection />
        </div>
      </main>
    </div>
  );
}
