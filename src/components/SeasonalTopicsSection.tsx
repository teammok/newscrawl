import {
  getLastMonthTopics,
  getNextMonthTopics,
  getThisMonthTopics,
  type SeasonalTopicWithDate,
} from "@/lib/seasonalTopics";

const CATEGORY_STYLE: Record<string, string> = {
  명절: "bg-rose-100 text-rose-700",
  기념일: "bg-amber-100 text-amber-700",
  웨딩시즌: "bg-fuchsia-100 text-fuchsia-700",
  문화축제: "bg-indigo-100 text-indigo-700",
  전통문화: "bg-teal-100 text-teal-700",
  시즌트렌드: "bg-sky-100 text-sky-700",
};

function TopicCard({ topic }: { topic: SeasonalTopicWithDate }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-neutral-900">{topic.name}</h3>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
            CATEGORY_STYLE[topic.category] ?? "bg-neutral-100 text-neutral-700"
          }`}
        >
          {topic.category}
        </span>
      </div>
      <p className="mb-2 text-xs font-medium text-neutral-500">{topic.dateLabel}</p>
      <p className="mb-3 text-sm text-neutral-600">{topic.description}</p>
      <ul className="space-y-1">
        {topic.reelIdeas.map((idea) => (
          <li key={idea} className="flex gap-1.5 text-sm text-neutral-700">
            <span className="text-rose-400">•</span>
            <span>{idea}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopicGroup({
  title,
  topics,
  emptyMessage,
  muted = false,
}: {
  title: string;
  topics: SeasonalTopicWithDate[];
  emptyMessage: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-80" : undefined}>
      <h3 className="mb-3 text-sm font-semibold text-neutral-500">{title}</h3>
      {topics.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeasonalTopicsSection({ now = new Date() }: { now?: Date }) {
  const lastMonth = getLastMonthTopics(now);
  const thisMonth = getThisMonthTopics(now);
  const nextMonth = getNextMonthTopics(now);

  const monthLabel = (offset: number) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() + offset, 1));
    return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월`;
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-neutral-900">📅 이번 달 고정 소재</h2>
        <span className="text-xs text-neutral-400">캘린더 기반 · 매년 반복 시즌 소재</span>
      </div>
      <div className="space-y-6">
        <TopicGroup
          title={`지난달 소재 (${monthLabel(-1)}) · 비교용`}
          topics={lastMonth}
          emptyMessage="지난달에는 해당하는 고정 시즌 소재가 없었습니다."
          muted
        />
        <TopicGroup
          title={`이번 달 소재 (${monthLabel(0)})`}
          topics={thisMonth}
          emptyMessage="이번 달에는 해당하는 고정 시즌 소재가 없습니다."
        />
        <TopicGroup
          title={`다음 달 예정 소재 (${monthLabel(1)})`}
          topics={nextMonth}
          emptyMessage="다음 달에는 해당하는 고정 시즌 소재가 없습니다."
        />
      </div>
    </section>
  );
}
