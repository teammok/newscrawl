import { NextResponse } from "next/server";
import { crawlNaverNews } from "@/lib/naverNews";
import { getNewsData, saveNewsData } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 대시보드의 "전체 업데이트" 버튼이 호출하는 엔드포인트.
// 짧은 시간에 여러 번 눌러도 네이버에 반복 요청을 보내지 않도록 최소 간격을 둔다.
const COOLDOWN_MS = 60_000;

export async function POST() {
  const existing = await getNewsData();

  if (existing) {
    const elapsedMs = Date.now() - new Date(existing.fetchedAt).getTime();
    if (elapsedMs < COOLDOWN_MS) {
      return NextResponse.json({ ok: true, throttled: true, fetchedAt: existing.fetchedAt });
    }
  }

  try {
    const data = await crawlNaverNews();
    await saveNewsData(data);
    return NextResponse.json({ ok: true, throttled: false, fetchedAt: data.fetchedAt });
  } catch (err) {
    console.error("[api/refresh] 뉴스 크롤링/저장 실패:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
