import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { NEWS_CACHE_TAG } from "@/lib/naverNews";

// 대시보드의 "전체 업데이트" 버튼이 호출하는 엔드포인트.
// 뉴스 크롤링 캐시를 무효화해서 다음 조회 시 네이버에서 즉시 새로 가져오게 합니다.
// (검색어 트렌드는 캐싱하지 않고 항상 라이브로 조회하므로 여기서 할 일이 없습니다.)
export async function POST() {
  // { expire: 0 }: 사용자가 버튼을 눌렀을 때 다음 요청에서 바로 새 데이터를 받도록
  // 즉시 만료시킵니다("max" 프로필의 stale-while-revalidate는 여기서 원하는 동작이 아닙니다).
  revalidateTag(NEWS_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
