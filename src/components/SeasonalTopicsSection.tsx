import {
  getNextMonthTopics,
  getThisMonthTopics,
  type SeasonalTopicWithDate,
} from "@/lib/seasonalTopics";

const CATEGORY_STYLE: Record<string, string> = {
  명절: "bg-rose-100 text-rose-700",
  기념일: "bg-amber-100 text-amber-700",
  웨딩시즌: "bg-pink-100 text-pink-700",
  문화축제: "bg-indigo-100 text-indigo-700",
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
}: {
  title: string;
  topics: SeasonalTopicWithDate[];
  emptyMessage: string;
}) {
  return (
    <div>
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
  const thisMonth = getThisMonthTopics(now);
  const nextMonth = getNextMonthTopics(now);
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  const nextDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  const nextMonthLabel = `${nextDate.getUTCFullYear()}년 ${nextDate.getUTCMonth() + 1}월`;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-neutral-900">📅 이번 달 고정 소재</h2>
        <span className="text-xs text-neutral-400">캘린더 기반 · 매년 반복 시즌 소재</span>
      </div>
      <div className="space-y-6">
        <TopicGroup
          title={`이번 달 소재 (${monthLabel})`}
          topics={thisMonth}
          emptyMessage="이번 달에는 해당하는 고정 시즌 소재가 없습니다."
        />
        <TopicGroup
          title={`다음 달 예정 소재 (${nextMonthLabel})`}
          topics={nextMonth}
          emptyMessage="다음 달에는 해당하는 고정 시즌 소재가 없습니다."
        />
      </div>
    </section>
  );
}
