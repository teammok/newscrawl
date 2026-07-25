import SeasonalTopicsSection from "@/components/SeasonalTopicsSection";
import NaverTrendsSection from "@/components/NaverTrendsSection";
import NewsSection from "@/components/NewsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
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
