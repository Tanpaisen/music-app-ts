import Image from "next/image";
import Link from "next/link";
import { Topic } from "@/types/home";

// Dùng Topic thay cho "Playlist" vì project chưa có model Playlist riêng.
// Trang công khai /topics/[topicSlug] hiển thị bài hát theo chủ đề bằng API JSON.
export default function TopicCarousel({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl text-ink">Chủ đề nổi bật</h2>
        <Link href="/topics" className="text-xs uppercase tracking-wide text-muted hover:text-amber">
          Xem tất cả
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/songs/${topic.slug}`}
            className="group w-48 shrink-0 rounded-2xl border border-line bg-panel p-3 transition-colors hover:border-amber/40"
          >
            <span className="relative block aspect-square overflow-hidden rounded-xl bg-raised">
              {topic.avatar && (
                <Image
                  src={topic.avatar}
                  alt={topic.title}
                  fill
                  sizes="192px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </span>
            <p className="mt-3 truncate font-display text-base text-ink">{topic.title}</p>
            {topic.description && (
              <p className="mt-0.5 truncate text-xs text-muted">{topic.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
