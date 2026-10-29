import Image from "next/image";
import { localDateString } from "@/lib/wca/competitions";
import { formatIsoDate } from "@/lib/wca/format";
import type { Video } from "@/lib/youtube";
import ExternalLink from "@/components/ExternalLink";
import LocalDate from "@/components/LocalDate";

// YouTube gives upload times in UTC. Each viewer sees the date in their own time
// zone; before the page hydrates, it's the date where the videos are made.
const UPLOAD_TIME_ZONE = "America/Los_Angeles";

interface VideoCardProps {
  video: Video;
  priority?: boolean;
  /** Heading level for the title, to fit the page outline. */
  headingLevel?: "h2" | "h3";
}

export default function VideoCard({ video, priority = false, headingLevel: Heading = "h3" }: VideoCardProps) {
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
        <Heading className="line-clamp-2 font-semibold leading-snug">
          {/* Stretched link: the whole card opens the video. */}
          <ExternalLink
            href={`https://www.youtube.com/watch?v=${video.id}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {video.title}
          </ExternalLink>
        </Heading>
        <p className="text-sm text-muted">
          <LocalDate iso={video.publishedAt} fallback={formatIsoDate(localDateString(new Date(video.publishedAt), UPLOAD_TIME_ZONE))} />
        </p>
      </div>
    </article>
  );
}
