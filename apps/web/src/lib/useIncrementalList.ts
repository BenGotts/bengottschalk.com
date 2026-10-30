"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shows a long list a page at a time, adding the next page as the end comes
 * near (infinite scroll). Attach `sentinelRef` to an element after the list,
 * ideally a "Show more" button so it also works from the keyboard via `showMore`.
 * Starts over from the first page whenever `items` changes (e.g. a new filter).
 */
export function useIncrementalList<T>(items: T[], pageSize: number) {
  const [count, setCount] = useState(pageSize);
  const [source, setSource] = useState(items);
  if (source !== items) {
    setSource(items);
    setCount(pageSize);
  }
  const sentinelRef = useRef<HTMLElement>(null);

  // Re-observe after each page, so a sentinel still in range loads the next one too.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || count >= items.length) return () => {};
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setCount(count + pageSize);
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [count, items.length, pageSize]);

  return {
    visible: items.slice(0, count),
    hasMore: count < items.length,
    showMore: () => setCount(count + pageSize),
    sentinelRef,
  };
}
