import { NextResponse } from "next/server";
import { fetchAllNaverNews } from "@/lib/naverNews";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchAllNaverNews();
  return NextResponse.json(result);
}
