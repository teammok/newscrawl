import { NextResponse, type NextRequest } from "next/server";
import { ALLOWED_TREND_DAYS, fetchNaverSearchTrend, type TrendDays, type TrendTimeUnit } from "@/lib/naverDatalab";

export const dynamic = "force-dynamic";

function parseDays(value: string | null): TrendDays {
  const n = Number(value);
  return (ALLOWED_TREND_DAYS as readonly number[]).includes(n) ? (n as TrendDays) : 30;
}

function parseTimeUnit(value: string | null): TrendTimeUnit {
  return value === "week" ? "week" : "date";
}

export async function GET(request: NextRequest) {
  const days = parseDays(request.nextUrl.searchParams.get("days"));
  const unit = parseTimeUnit(request.nextUrl.searchParams.get("unit"));
  const result = await fetchNaverSearchTrend(days, unit);
  return NextResponse.json(result);
}
