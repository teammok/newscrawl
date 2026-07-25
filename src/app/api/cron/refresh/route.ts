import { NextResponse, type NextRequest } from "next/server";
import { crawlNaverNews } from "@/lib/naverNews";
import { saveNewsData } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron이 매일 아침 호출하는 엔드포인트 (vercel.json 참고).
// CRON_SECRET 환경변수를 설정해두면 Vercel이 자동으로
// `Authorization: Bearer <CRON_SECRET>` 헤더를 붙여서 호출하고,
// 여기서 그 값을 검증해 외부에서 함부로 호출하지 못하게 막습니다.
// (CRON_SECRET을 아직 설정하지 않았다면 검증 없이 통과시킵니다 - 로컬 테스트 편의용)
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const data = await crawlNaverNews();
    await saveNewsData(data);
    return NextResponse.json({ ok: true, fetchedAt: data.fetchedAt });
  } catch (err) {
    console.error("[api/cron/refresh] 뉴스 크롤링/저장 실패:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
