// 네이버 뉴스 검색 결과 크롤링 (서버 전용, cheerio)
// 공식 API가 아닌 검색 결과 페이지의 HTML을 파싱하므로, 네이버가 마크업을 바꾸면
// 셀렉터가 깨질 수 있습니다. 그래서 실패해도 앱이 죽지 않고 각 키워드별로
// "가져오기 실패" 상태만 표시되도록 방어적으로 작성했습니다.

import * as cheerio from "cheerio";

// 여기 배열만 수정하면 검색 키워드를 쉽게 추가/삭제/교체할 수 있습니다.
export const NEWS_KEYWORDS = ["한복", "전통의상", "궁중문화"] as const;

const SEARCH_URL = "https://search.naver.com/search.naver";
const MAX_ARTICLES_PER_KEYWORD = 6;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// 방문할 때마다 네이버에 크롤링 요청을 보내지 않도록 Next.js Data Cache에 태그를 걸어
// 6시간마다 자동 갱신하고, /api/refresh(수동 버튼)나 Vercel Cron이 이 태그를
// revalidateTag로 무효화하면 다음 요청에서 즉시 새로 크롤링합니다.
export const NEWS_CACHE_TAG = "naver-news";
const REVALIDATE_SECONDS = 60 * 60 * 6;

export interface NewsArticle {
  title: string;
  url: string;
  press: string;
  publishedLabel: string;
  description: string;
}

export interface NewsKeywordGroup {
  keyword: string;
  status: "ok" | "error";
  articles: NewsArticle[];
  message?: string;
}

export interface NaverNewsResult {
  groups: NewsKeywordGroup[];
  fetchedAt: string;
}

function parseArticles(html: string): NewsArticle[] {
  const $ = cheerio.load(html);
  const articles: NewsArticle[] = [];
  const seenUrls = new Set<string>();

  $(".news_area").each((_, el) => {
    const root = $(el);
    const titleEl = root.find("a.news_tit").first();
    const title = titleEl.text().trim();
    const url = titleEl.attr("href")?.trim();
    if (!title || !url || seenUrls.has(url)) return;

    const press = root.find(".info_group a.press").first().text().trim();

    // .info_group 안의 span.info 중 언론사/부가정보가 아니라 "N시간 전" 같은
    // 시간 표기가 보통 맨 마지막에 옴 -> 마지막 span.info를 시간 라벨로 사용
    const infoSpans = root.find(".info_group span.info");
    const publishedLabel = infoSpans.length > 0 ? infoSpans.last().text().trim() : "";

    const description = root.find(".news_dsc .dsc_wrap, .dsc_wrap").first().text().trim();

    seenUrls.add(url);
    articles.push({ title, url, press, publishedLabel, description });
  });

  return articles.slice(0, MAX_ARTICLES_PER_KEYWORD);
}

async function fetchKeywordNews(keyword: string): Promise<NewsKeywordGroup> {
  const url = `${SEARCH_URL}?where=news&query=${encodeURIComponent(keyword)}&sort=1`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS, tags: [NEWS_CACHE_TAG] },
    });
  } catch (err) {
    console.error(`[naverNews] "${keyword}" 요청 자체가 실패했습니다 (네트워크/DNS 등):`, err);
    return {
      keyword,
      status: "error",
      articles: [],
      message: err instanceof Error ? `네트워크 오류: ${err.message}` : "네트워크 오류로 뉴스를 가져오지 못했습니다.",
    };
  }

  if (!res.ok) {
    console.error(`[naverNews] "${keyword}" 검색 페이지 응답 오류 - status: ${res.status} ${res.statusText}`);
    return {
      keyword,
      status: "error",
      articles: [],
      message: `뉴스 검색 페이지 응답 오류 (${res.status} ${res.statusText})`,
    };
  }

  try {
    const html = await res.text();
    const articles = parseArticles(html);
    return { keyword, status: "ok", articles };
  } catch (err) {
    console.error(`[naverNews] "${keyword}" HTML 파싱 실패 - 네이버 마크업이 바뀌었을 수 있습니다:`, err);
    return {
      keyword,
      status: "error",
      articles: [],
      message: "뉴스 목록 파싱에 실패했습니다 (검색 결과 페이지 구조가 바뀌었을 수 있어요).",
    };
  }
}

export async function fetchAllNaverNews(): Promise<NaverNewsResult> {
  const groups = await Promise.all(NEWS_KEYWORDS.map((keyword) => fetchKeywordNews(keyword)));
  return { groups, fetchedAt: new Date().toISOString() };
}
