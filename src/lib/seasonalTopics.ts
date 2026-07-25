// 한복궁 릴스 소재 발굴용 - 매년 반복되는 시즌 소재 데이터
// 음력 기반 명절(설날/추석 등)은 매년 양력 날짜가 바뀌므로 연도별로 하드코딩되어 있습니다.
// 목록에 없는 연도가 오면 자동으로 "날짜 확인 필요" 상태로 표시됩니다.

export type SeasonalCategory =
  | "명절"
  | "기념일"
  | "웨딩시즌"
  | "문화축제"
  | "전통문화"
  | "시즌트렌드";

export interface SeasonalTopic {
  id: string;
  name: string;
  category: SeasonalCategory;
  description: string;
  reelIdeas: string[];
  /** 해당 연도에 이 소재가 "활성"인 월(1~12) 목록을 반환 */
  getActiveMonths: (year: number) => number[];
  /** 해당 연도의 구체적인 날짜/기간 라벨 (UI 표시용) */
  getDateLabel: (year: number) => string;
}

// --- 음력 명절 날짜 테이블 (양력 환산, 확인된 연도만 등록) -------------------
const SEOLLAL_DATES: Record<number, string> = {
  2024: "2024-02-10",
  2025: "2025-01-29",
  2026: "2026-02-17",
  2027: "2027-02-06",
  2028: "2028-01-26",
};

const CHUSEOK_DATES: Record<number, string> = {
  2024: "2024-09-17",
  2025: "2025-10-06",
  2026: "2026-09-25",
  2027: "2027-09-15",
  2028: "2028-10-03",
};

function monthOf(dateStr: string): number {
  return Number(dateStr.slice(5, 7));
}

function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 5월의 세 번째 월요일(성년의날) 날짜를 계산 */
function thirdMondayOfMay(year: number): Date {
  const dow = new Date(Date.UTC(year, 4, 1)).getUTCDay(); // 5/1 요일 (0=일 ... 1=월)
  const diffToMonday = (1 - dow + 7) % 7;
  const firstMondayDay = 1 + diffToMonday;
  const thirdMondayDay = firstMondayDay + 14;
  return new Date(Date.UTC(year, 4, thirdMondayDay));
}

export const SEASONAL_TOPICS: SeasonalTopic[] = [
  {
    id: "seollal",
    name: "설날",
    category: "명절",
    description: "온 가족이 한복을 갖춰 입는 대표 명절. 세배, 차례 콘텐츠 수요가 급증하는 시기.",
    reelIdeas: [
      "세배 한복 코디 & 입는 법 타임랩스",
      "온 가족(아이~어른) 한복 매칭 룩북",
      "설날 한복 vs 평상시 한복 차이 비교",
    ],
    getActiveMonths: (year) => {
      const dateStr = SEOLLAL_DATES[year];
      return dateStr ? [monthOf(dateStr)] : [];
    },
    getDateLabel: (year) => {
      const dateStr = SEOLLAL_DATES[year];
      return dateStr ? `${formatKoreanDate(dateStr)} (음력 1월 1일)` : "날짜 확인 필요 (데이터 미등록 연도)";
    },
  },
  {
    id: "daeboreum",
    name: "정월대보름",
    category: "명절",
    description: "설날에서 14일 뒤, 음력 새해 첫 보름달이 뜨는 날. 부럼 깨기 등 전통 세시풍속과 한복을 엮은 콘텐츠에 좋음.",
    reelIdeas: [
      "보름달 배경 한복 야간 촬영",
      "부럼 깨기 + 전통 놀이 한복 브이로그",
      "정월대보름 세시풍속 소개 릴스",
    ],
    getActiveMonths: (year) => {
      const seollal = SEOLLAL_DATES[year];
      return seollal ? [monthOf(addDays(seollal, 14))] : [];
    },
    getDateLabel: (year) => {
      const seollal = SEOLLAL_DATES[year];
      return seollal
        ? `${formatKoreanDate(addDays(seollal, 14))} (음력 1월 15일)`
        : "날짜 확인 필요 (데이터 미등록 연도)";
    },
  },
  {
    id: "chuseok",
    name: "추석",
    category: "명절",
    description: "설날과 함께 한복 수요가 가장 높은 명절. 차례상, 성묘 콘텐츠와 연계 가능.",
    reelIdeas: [
      "추석 한복 코디 & 벌초/성묘용 실용 한복",
      "차례상 차리며 입는 한복 브이로그",
      "추석 선물용 한복 세트 소개",
    ],
    getActiveMonths: (year) => {
      const dateStr = CHUSEOK_DATES[year];
      return dateStr ? [monthOf(dateStr)] : [];
    },
    getDateLabel: (year) => {
      const dateStr = CHUSEOK_DATES[year];
      return dateStr ? `${formatKoreanDate(dateStr)} (음력 8월 15일)` : "날짜 확인 필요 (데이터 미등록 연도)";
    },
  },
  {
    id: "seongnyeon",
    name: "성년의날",
    category: "기념일",
    description: "만 19세 성년을 축하하는 날(매년 5월 셋째 월요일). 생활한복/개량한복 데이트 소재로 활용 가능.",
    reelIdeas: [
      "성년의날 선물 세트(장미/향수/한복 소품) 콘텐츠",
      "성년의날 기념 개량한복 데이트룩",
      "20살 첫 한복 브이로그",
    ],
    getActiveMonths: () => [5],
    getDateLabel: (year) => {
      const d = thirdMondayOfMay(year);
      return `${formatKoreanDate(d.toISOString().slice(0, 10))} (5월 셋째 월요일)`;
    },
  },
  {
    id: "children-day",
    name: "어린이날",
    category: "기념일",
    description: "가족 단위 나들이가 몰리는 날. 궁·한옥마을에서 아이 한복 촬영 수요가 특히 높음.",
    reelIdeas: [
      "아이 한복 룩북 & 사이즈 가이드",
      "가족 나들이 한복 매칭 코디",
      "궁 나들이 아이 한복 브이로그",
    ],
    getActiveMonths: () => [5],
    getDateLabel: (year) => `${year}년 5월 5일 (고정일)`,
  },
  {
    id: "parents-day",
    name: "어버이날",
    category: "기념일",
    description: "부모님 선물/효도 사진 수요가 몰리는 날. 가족 한복 촬영, 선물 세트 콘텐츠에 적합.",
    reelIdeas: [
      "부모님 한복 선물 세트 소개",
      "3대가 함께하는 가족 한복 촬영",
      "카네이션 + 한복 감사 인사 릴스",
    ],
    getActiveMonths: () => [5],
    getDateLabel: (year) => `${year}년 5월 8일 (고정일)`,
  },
  {
    id: "hangeul-day",
    name: "한글날",
    category: "기념일",
    description: "한글 창제를 기리는 날. 한복+전통문화 콘텐츠로 브랜드 정체성을 강조하기 좋은 시기.",
    reelIdeas: [
      "한글 자수/문양 한복 소개",
      "한복 입고 즐기는 전통문화 체험 릴스",
      "외국인 친구와 함께하는 한복+한글 콘텐츠",
    ],
    getActiveMonths: () => [10],
    getDateLabel: (year) => `${year}년 10월 9일 (고정일)`,
  },
  {
    id: "spring-wedding",
    name: "봄 웨딩시즌",
    category: "웨딩시즌",
    description: "4~5월 결혼 성수기. 전통혼례, 폐백 한복 수요가 집중되는 시기.",
    reelIdeas: [
      "봄 신부 웨딩한복 룩북",
      "폐백 한복 필수 소품 리스트",
      "전통혼례 vs 스몰웨딩 한복 스타일링 비교",
    ],
    getActiveMonths: () => [4, 5],
    getDateLabel: (year) => `${year}년 4월 1일 ~ 5월 31일`,
  },
  {
    id: "autumn-wedding",
    name: "가을 웨딩시즌",
    category: "웨딩시즌",
    description: "9~10월 결혼 성수기. 야외 촬영이 많아 색감이 화려한 웨딩한복 콘텐츠에 유리.",
    reelIdeas: [
      "가을 야외 웨딩한복 촬영 비하인드",
      "단풍 배경 전통혼례 하이라이트",
      "가을 컬러 폐백 한복 트렌드",
    ],
    getActiveMonths: () => [9, 10],
    getDateLabel: (year) => `${year}년 9월 1일 ~ 10월 31일`,
  },
  {
    id: "royal-culture-festival",
    name: "궁중문화축전",
    category: "문화축제",
    description: "경복궁 등 5대 궁·종묘에서 열리는 국내 최대 전통문화축제. 보통 봄(5월)·가을(10월) 두 차례 개최.",
    reelIdeas: [
      "궁중문화축전 현장 한복 착장 브이로그",
      "궁 배경 한복 촬영 스팟 추천",
      "축전 연계 한복 대여 이벤트 홍보",
    ],
    getActiveMonths: () => [5, 10],
    getDateLabel: () => "5월, 10월 중 (회차별 정확한 일정은 매년 축전 공식 발표 확인 필요)",
  },
  {
    id: "dano",
    name: "단오",
    category: "전통문화",
    description: "음력 5월 5일, 한 해의 양기가 가장 왕성한 날로 여겨지는 전통 명절. 창포물 머리감기 등 전통 소재로 활용.",
    reelIdeas: [
      "단오 창포물 머리감기 전통 콘텐츠",
      "단오 부채 소품 활용 한복 스타일링",
      "전통 놀이(그네뛰기 등) + 한복 릴스",
    ],
    // 음력 5월 5일은 해마다 양력 5월 말~6월 초 사이에 위치 (정확한 날짜는 연도별 확인 필요)
    getActiveMonths: () => [6],
    getDateLabel: () => "음력 5월 5일 (양력 기준 매년 상이, 통상 5월 말~6월 초 · 정확한 날짜는 연도별 확인 필요)",
  },
  {
    id: "chilseok",
    name: "칠석",
    category: "전통문화",
    description: "음력 7월 7일, 견우와 직녀가 만난다는 한국판 발렌타인데이. 커플 한복 콘텐츠와 잘 맞음.",
    reelIdeas: [
      "칠석 커플 한복 데이트룩",
      "견우직녀 설화 스토리텔링 릴스",
      "칠석 기념 한복 대여 이벤트 홍보",
    ],
    // 음력 7월 7일은 해마다 양력 8월 초중순에 위치 (정확한 날짜는 연도별 확인 필요)
    getActiveMonths: () => [8],
    getDateLabel: () => "음력 7월 7일 (양력 기준 매년 상이, 통상 8월 초중순 · 정확한 날짜는 연도별 확인 필요)",
  },
  {
    id: "summer-hanbok",
    name: "여름 한복 시즌",
    category: "시즌트렌드",
    description: "무더위에 맞춰 모시·생냉 등 통기성 좋은 여름 원단 한복 수요가 늘어나는 시기.",
    reelIdeas: [
      "모시/생냉 원단 여름 한복 소개",
      "땀 걱정 없는 여름 한복 착용 꿀팁",
      "휴가철 한옥마을 여름 한복 화보",
    ],
    getActiveMonths: () => [6, 7],
    getDateLabel: (year) => `${year}년 6월 1일 ~ 7월 31일`,
  },
  {
    id: "year-end",
    name: "연말연시",
    category: "시즌트렌드",
    description: "한 해를 마무리하고 새해를 맞이하는 시기. 가족 모임, 신년 인사 콘텐츠와 한복을 엮기 좋음.",
    reelIdeas: [
      "신년 인사 한복 영상 (연하장 콘셉트)",
      "연말 가족 모임 한복 스냅",
      "새해 첫날 일출 한복 브이로그",
    ],
    getActiveMonths: () => [12],
    getDateLabel: (year) => `${year}년 12월`,
  },
];

export interface SeasonalTopicWithDate extends SeasonalTopic {
  dateLabel: string;
}

function topicsActiveInMonth(year: number, month: number): SeasonalTopicWithDate[] {
  return SEASONAL_TOPICS.filter((topic) => topic.getActiveMonths(year).includes(month)).map(
    (topic) => ({ ...topic, dateLabel: topic.getDateLabel(year) })
  );
}

function shiftMonth(now: Date, offset: number): { year: number; month: number } {
  const shifted = new Date(Date.UTC(now.getFullYear(), now.getMonth() + offset, 1));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 };
}

export function getLastMonthTopics(now: Date = new Date()): SeasonalTopicWithDate[] {
  const { year, month } = shiftMonth(now, -1);
  return topicsActiveInMonth(year, month);
}

export function getThisMonthTopics(now: Date = new Date()): SeasonalTopicWithDate[] {
  return topicsActiveInMonth(now.getFullYear(), now.getMonth() + 1);
}

export function getNextMonthTopics(now: Date = new Date()): SeasonalTopicWithDate[] {
  const { year, month } = shiftMonth(now, 1);
  return topicsActiveInMonth(year, month);
}
