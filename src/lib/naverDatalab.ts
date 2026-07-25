// 네이버 데이터랩 검색어트렌드 API 연동 (서버 전용)
// https://developers.naver.com/docs/serviceapi/datalab/search/search.md

const NAVER_DATALAB_URL = "https://openapi.naver.com/v1/datalab/search";

// 네이버 데이터랩 API는 요청 1건당 keywordGroups를 최대 5개까지만 허용합니다.
// 아래 목록에 키워드를 추가/삭제/교체하면 되고, 5개를 넘으면 자동으로 여러 번 나눠 요청합니다.
export const TREND_KEYWORDS = [
  "한복",
  "전통혼례",
  "궁중의상",
  "웨딩한복",
  "한복대여",
  "혼주한복",
  "한복모델선발대회",
  "한복패션쇼",
] as const;

const MAX_KEYWORD_GROUPS_PER_REQUEST = 5;

export type TrendTimeUnit = "date" | "week";
export const ALLOWED_TREND_DAYS = [7, 30, 90] as const;
export type TrendDays = (typeof ALLOWED_TREND_DAYS)[number];

export interface NaverTrendPoint {
  period: string;
  ratio: number;
}

export interface NaverTrendSeriesResult {
  keyword: string;
  data: NaverTrendPoint[];
}

export type NaverTrendResult =
  | { status: "not_configured" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      series: NaverTrendSeriesResult[];
      fetchedAt: string;
      startDate: string;
      endDate: string;
      timeUnit: TrendTimeUnit;
    };

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

interface NaverDatalabResponse {
  results: {
    title: string;
    keywords: string[];
    data: { period: string; ratio: number }[];
  }[];
}

async function fetchKeywordGroupBatch(
  keywords: readonly string[],
  startDate: string,
  endDate: string,
  timeUnit: TrendTimeUnit,
  clientId: string,
  clientSecret: string
): Promise<NaverTrendSeriesResult[]> {
  const requestBody = {
    startDate,
    endDate,
    timeUnit,
    keywordGroups: keywords.map((keyword) => ({
      groupName: keyword,
      keywords: [keyword],
    })),
  };

  let res: Response;
  try {
    // POST 요청 바디(키워드 배치)가 매번 달라서 Next.js 캐시 태그를 걸면
    // 같은 URL의 다른 배치 응답이 뒤섞일 위험이 있어, 항상 캐시 없이 라이브로 호출합니다.
    // (검색 트렌드는 어차피 매 요청마다 최신값이어야 의미가 있어 캐싱 이점도 크지 않습니다.)
    res = await fetch(NAVER_DATALAB_URL, {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });
  } catch (err) {
    console.error(
      "[naverDatalab] fetch 자체가 실패했습니다 (네트워크/DNS 등). keywords:",
      keywords,
      "requestBody:",
      requestBody,
      "원본 에러:",
      err
    );
    throw new Error(err instanceof Error ? `네트워크 오류: ${err.message}` : "네트워크 오류로 데이터를 가져오지 못했습니다.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      `[naverDatalab] API 오류 응답 - status: ${res.status} ${res.statusText}`,
      "\n  keywords:", keywords,
      "\n  requestBody:", requestBody,
      "\n  응답 본문:", text
    );
    if (res.status === 401) {
      console.error(
        "[naverDatalab] 401 Unauthorized → NAVER_CLIENT_ID/NAVER_CLIENT_SECRET 값이 잘못되었거나, " +
          "네이버 개발자센터에서 해당 애플리케이션에 '데이터랩(검색어트렌드)' API 사용 설정이 안 되어 있을 수 있습니다."
      );
    }
    throw new Error(
      `네이버 데이터랩 API 오류 (${res.status} ${res.statusText})${text ? `: ${text.slice(0, 200)}` : ""}`
    );
  }

  const json = (await res.json()) as NaverDatalabResponse;
  return json.results.map((r) => ({ keyword: r.title, data: r.data }));
}

export async function fetchNaverSearchTrend(
  days: TrendDays = 30,
  timeUnit: TrendTimeUnit = "date"
): Promise<NaverTrendResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { status: "not_configured" };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  const batches = chunk(TREND_KEYWORDS, MAX_KEYWORD_GROUPS_PER_REQUEST);

  try {
    const batchResults = await Promise.all(
      batches.map((batch) =>
        fetchKeywordGroupBatch(batch, startDateStr, endDateStr, timeUnit, clientId, clientSecret)
      )
    );

    return {
      status: "ok",
      series: batchResults.flat(),
      fetchedAt: new Date().toISOString(),
      startDate: startDateStr,
      endDate: endDateStr,
      timeUnit,
    };
  } catch (err) {
    console.error("[naverDatalab] fetchNaverSearchTrend 실패:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "알 수 없는 오류로 데이터를 가져오지 못했습니다.",
    };
  }
}
