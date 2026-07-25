import { NextResponse } from "next/server";
import { getNewsData } from "@/lib/storage";

export const dynamic = "force-dynamic";

// 크롤링은 하지 않고, 저장된(캐시된) 뉴스 데이터를 읽기만 합니다.
// 실제 크롤링은 /api/refresh(수동) 또는 /api/cron/refresh(매일 아침)에서 수행됩니다.
export async function GET() {
  const data = await getNewsData();

  if (!data) {
    return NextResponse.json({ status: "empty" as const });
  }

  return NextResponse.json({ status: "ok" as const, data });
}
