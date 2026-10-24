import Image from "next/image";
import type { Avatar } from "@/lib/wca";

// Show a little more around the WCA thumbnail crop than the thumbnail does.
const ZOOM_OUT = 1.4;

// Rendered sizes of the square, matching the classes below.
const SMALL_PX = 112;
const LARGE_PX = 320;

/** The thumbnail crop widened by `ZOOM_OUT` around its centre, kept inside the photo. */
function widenCrop({ width, height, crop }: Avatar): Avatar["crop"] {
  if (!crop) return null;
  const size = Math.min(crop.size * ZOOM_OUT, width, height);
  const clamp = (start: number, max: number) => Math.min(Math.max(start, 0), max - size);
  return {
    x: clamp(crop.x + crop.size / 2 - size / 2, width),
    y: clamp(crop.y + crop.size / 2 - size / 2, height),
    size,
  };
}

/**
 * The WCA profile photo, cropped to (a little more than) the square chosen for the WCA thumbnail.
 * The full photo is scaled and shifted inside the square, so the crop stays
 * sharp at any size.
 */
export default function WcaAvatar({ avatar, alt }: { avatar: Avatar; alt: string }) {
  const crop = widenCrop(avatar);
  // How many times wider the photo is than the crop.
  const scale = crop ? avatar.width / crop.size : 1;
  const sizes = `(min-width: 1024px) ${Math.ceil(LARGE_PX * scale)}px, ${Math.ceil(SMALL_PX * scale)}px`;

  return (
    <div className="relative size-28 shrink-0 lg:size-80">
      {/* A cube-coloured frame offset behind the photo. */}
      <div
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-box bg-linear-to-br from-primary to-secondary opacity-70 lg:translate-x-4 lg:translate-y-4"
        aria-hidden="true"
      />
      <div className="relative size-full overflow-hidden rounded-box border border-base-300 bg-base-300">
        {crop ? (
          <Image
            src={avatar.url}
            alt={alt}
            width={avatar.width}
            height={avatar.height}
            sizes={sizes}
            priority
            className="absolute max-w-none"
            style={{
              width: `${scale * 100}%`,
              height: "auto",
              // Percentages of the square's width (and height, which is the same).
              left: `${(-crop.x / crop.size) * 100}%`,
              top: `${(-crop.y / crop.size) * 100}%`,
            }}
          />
        ) : (
          <Image src={avatar.url} alt={alt} fill sizes={sizes} priority className="object-cover" />
        )}
      </div>
    </div>
  );
}
