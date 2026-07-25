import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { NEWS_CACHE_TAG } from "@/lib/naverNews";

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

  // { expire: 0 }: 아침 크론이 돌면 바로 새 크롤링 결과를 받도록 즉시 만료시킵니다.
  revalidateTag(NEWS_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
