import Image from "next/image";
import { formatIsoDate } from "@/lib/wca/format";
import type { Video } from "@/lib/youtube";

export default function VideoCard({ video, priority = false }: { video: Video; priority?: boolean }) {
  return (
    <article className="card group relative overflow-hidden border border-base-300 bg-base-200 transition-colors hover:border-primary">
      <div className="relative aspect-video bg-base-300">
        {video.thumbnail && (
          <Image
            src={video.thumbnail.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        )}
      </div>
      <div className="card-body gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">
          {/* Stretched link: the whole card opens the video. */}
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {video.title}
          </a>
        </h3>
        <p className="text-sm text-muted">{formatIsoDate(video.publishedAt.slice(0, 10))}</p>
      </div>
    </article>
  );
}
