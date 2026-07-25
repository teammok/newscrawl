import { NextResponse } from "next/server";
import { fetchNaverSearchTrend } from "@/lib/naverDatalab";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchNaverSearchTrend();
  return NextResponse.json(result);
}
