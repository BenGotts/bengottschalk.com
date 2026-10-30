import "@cubing/icons";

/**
 * Square-1 icon that turns into a 3x3 when its parent `.group` link is hovered
 * or focused. Without reduced motion it also rotates and scales.
 */
export default function BrandMark() {
  return (
    <span className="relative inline-flex size-7 shrink-0 items-center justify-center text-2xl" aria-hidden="true">
      <span className="cubing-icon event-sq1 absolute text-primary transition duration-300 group-hover:opacity-0 group-focus-visible:opacity-0 motion-safe:group-hover:scale-75 motion-safe:group-hover:rotate-12 motion-safe:group-focus-visible:scale-75 motion-safe:group-focus-visible:rotate-12" />
      <span className="cubing-icon event-333 absolute text-secondary opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:scale-75 motion-safe:-rotate-12 motion-safe:group-hover:scale-100 motion-safe:group-hover:rotate-0 motion-safe:group-focus-visible:scale-100 motion-safe:group-focus-visible:rotate-0" />
    </span>
  );
}
