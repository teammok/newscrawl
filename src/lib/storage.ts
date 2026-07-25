// 크롤링된 뉴스 데이터의 저장소.
// 예전 "네이버 랭킹뉴스" 프로젝트와 동일한 패턴: Vercel Blob에 저장하고,
// BLOB_READ_WRITE_TOKEN이 없는 로컬 개발 환경에서는 파일로 폴백합니다.

import fs from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";
import type { NaverNewsResult } from "./naverNews";

const BLOB_PATHNAME = "naver-news.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "naver-news.json");

function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function saveNewsData(data: NaverNewsResult): Promise<void> {
  const json = JSON.stringify(data, null, 2);

  if (hasBlobToken()) {
    await put(BLOB_PATHNAME, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      // 매일 갱신되는 데이터라 CDN에 오래 캐시되면 안 됨 (최소값 1분)
      cacheControlMaxAge: 60,
    });
    return;
  }

  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, json, "utf-8");
}

export async function getNewsData(): Promise<NaverNewsResult | null> {
  if (hasBlobToken()) {
    try {
      const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
      const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
      if (!blob) return null;

      const res = await fetch(blob.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as NaverNewsResult;
    } catch (err) {
      console.error("[storage] Vercel Blob에서 뉴스 데이터를 읽지 못했습니다:", err);
      return null;
    }
  }

  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf-8");
    return JSON.parse(raw) as NaverNewsResult;
  } catch {
    return null;
  }
}
