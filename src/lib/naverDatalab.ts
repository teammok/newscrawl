// 네이버 데이터랩 검색어트렌드 API 연동 (서버 전용)
// https://developers.naver.com/docs/serviceapi/datalab/search/search.md

const NAVER_DATALAB_URL = "https://openapi.naver.com/v1/datalab/search";

export const TREND_KEYWORDS = ["한복", "전통혼례", "궁중의상", "웨딩한복", "한복대여"] as const;

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
  | { status: "ok"; series: NaverTrendSeriesResult[]; fetchedAt: string; startDate: string; endDate: string };

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface NaverDatalabResponse {
  results: {
    title: string;
    keywords: string[];
    data: { period: string; ratio: number }[];
  }[];
}

export async function fetchNaverSearchTrend(days = 90): Promise<NaverTrendResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { status: "not_configured" };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const requestBody = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    timeUnit: "date",
    keywordGroups: TREND_KEYWORDS.map((keyword) => ({
      groupName: keyword,
      keywords: [keyword],
    })),
  };

  let res: Response;
  try {
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
    return {
      status: "error",
      message: err instanceof Error ? `네트워크 오류: ${err.message}` : "네트워크 오류로 데이터를 가져오지 못했습니다.",
    };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      status: "error",
      message: `네이버 데이터랩 API 오류 (${res.status} ${res.statusText})${text ? `: ${text.slice(0, 200)}` : ""}`,
    };
  }

  const json = (await res.json()) as NaverDatalabResponse;

  return {
    status: "ok",
    series: json.results.map((r) => ({ keyword: r.title, data: r.data })),
    fetchedAt: new Date().toISOString(),
    startDate: requestBody.startDate,
    endDate: requestBody.endDate,
  };
}
