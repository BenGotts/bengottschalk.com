import { describe, expect, it, vi } from "vitest";
import { ScrambleQueue } from "./scrambleQueue";

/** A stand-in for cubing.js where each scramble is finished (or failed) by hand. */
function fakeGenerator() {
  const calls: { eventId: string; resolve: (scramble: string) => void; reject: (error: Error) => void }[] = [];
  const generate = vi.fn(
    (eventId: string) =>
      new Promise<string>((resolve, reject) => {
        calls.push({ eventId, resolve, reject });
      }),
  );
  return { generate, calls };
}

/** Lets the queue's promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function started(eventId = "333") {
  const fake = fakeGenerator();
  const queue = new ScrambleQueue(fake.generate, eventId);
  queue.show(eventId);
  await settle();
  return { ...fake, queue };
}

describe("ScrambleQueue", () => {
  it("starts the next scramble as soon as one is shown", async () => {
    const { queue, calls } = await started();
    expect(calls).toHaveLength(1);
    calls[0].resolve("A");
    await settle();
    expect(queue.getSnapshot().scramble).toBe("A");
    expect(calls).toHaveLength(2);
    expect(calls[1].eventId).toBe("333");
  });

  it("shows the one made ahead straight away, then makes the one after", async () => {
    const { queue, calls } = await started();
    calls[0].resolve("A");
    await settle();
    calls[1].resolve("B");
    await settle();
    queue.next();
    // Synchronously: no "Making a scramble…" in between.
    expect(queue.getSnapshot()).toMatchObject({ scramble: "B", history: ["A"] });
    await settle();
    expect(calls).toHaveLength(3);
  });

  it("waits for the one made ahead when it isn't ready, without making another", async () => {
    const { queue, calls } = await started();
    calls[0].resolve("A");
    await settle();
    queue.next();
    expect(queue.getSnapshot()).toMatchObject({ scramble: null, history: ["A"] });
    // Pressing Next again while waiting changes nothing.
    queue.next();
    await settle();
    expect(calls).toHaveLength(2);
    expect(queue.getSnapshot().history).toEqual(["A"]);
    calls[1].resolve("B");
    await settle();
    expect(queue.getSnapshot().scramble).toBe("B");
    expect(calls).toHaveLength(3);
  });

  it("drops a scramble for the old event that lands after the event changed", async () => {
    const { queue, calls } = await started("333");
    queue.show("444");
    await settle();
    expect(calls.map((c) => c.eventId)).toEqual(["333", "444"]);
    calls[1].resolve("Uw 444");
    calls[0].resolve("R 333");
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ eventId: "444", scramble: "Uw 444", history: [] });
    // The one made ahead is for the new event.
    expect(calls[2].eventId).toBe("444");
  });

  it("throws away the queued scramble when the event changes", async () => {
    const { queue, calls } = await started("333");
    calls[0].resolve("A");
    await settle();
    calls[1].resolve("B");
    queue.show("222");
    await settle();
    calls[2].resolve("C");
    await settle();
    queue.next();
    expect(queue.getSnapshot()).toMatchObject({ eventId: "222", scramble: null, history: ["C"] });
    expect(calls[3].eventId).toBe("222");
  });

  it("ignores everything once stopped", async () => {
    const { queue, calls } = await started();
    const listener = vi.fn();
    queue.subscribe(listener);
    queue.stop();
    calls[0].resolve("A");
    await settle();
    queue.next();
    expect(listener).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it("starts again on the same event after a stop", async () => {
    const { queue, calls } = await started();
    queue.stop();
    queue.show("333");
    await settle();
    expect(calls).toHaveLength(2);
    calls[0].resolve("old");
    calls[1].resolve("new");
    await settle();
    expect(queue.getSnapshot().scramble).toBe("new");
  });

  it("keeps the queued scramble for after a custom one", async () => {
    const { queue, calls } = await started();
    calls[0].resolve("A");
    await settle();
    calls[1].resolve("B");
    await settle();
    queue.applyCustom("R U R' U'");
    expect(queue.getSnapshot()).toMatchObject({ scramble: "R U R' U'", custom: true, history: ["A"] });
    queue.next();
    expect(queue.getSnapshot()).toMatchObject({ scramble: "B", custom: false, history: ["A", "R U R' U'"] });
  });

  it("keeps a scramble still being made when a custom one is entered meanwhile", async () => {
    const { queue, calls } = await started();
    queue.applyCustom("R U");
    calls[0].resolve("A");
    await settle();
    // It doesn't replace the custom scramble, and isn't made twice.
    expect(queue.getSnapshot()).toMatchObject({ scramble: "R U", custom: true });
    expect(calls).toHaveLength(1);
    queue.next();
    expect(queue.getSnapshot()).toMatchObject({ scramble: "A", history: ["R U"] });
  });

  it("goes back with Previous, keeping the queue", async () => {
    const { queue, calls } = await started();
    calls[0].resolve("A");
    await settle();
    calls[1].resolve("B");
    await settle();
    queue.next();
    await settle();
    queue.previous();
    expect(queue.getSnapshot()).toMatchObject({ scramble: "A", history: [] });
    expect(calls).toHaveLength(3);
    calls[2].resolve("C");
    await settle();
    queue.next();
    expect(queue.getSnapshot()).toMatchObject({ scramble: "C", history: ["A"] });
  });

  it("shows an error when a scramble fails, and tries again on Next", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { queue, calls } = await started();
    calls[0].reject(new Error("worker died"));
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ scramble: null, error: "Couldn't make a scramble. Try again." });
    expect(calls).toHaveLength(1);
    queue.next();
    expect(queue.getSnapshot().error).toBeNull();
    await settle();
    calls[1].resolve("A");
    await settle();
    expect(queue.getSnapshot().scramble).toBe("A");
    error.mockRestore();
  });

  it("makes a fresh one when the queued scramble failed", async () => {
    const { queue, calls } = await started();
    calls[0].resolve("A");
    await settle();
    calls[1].reject(new Error("worker died"));
    await settle();
    queue.next();
    await settle();
    expect(calls).toHaveLength(3);
    calls[2].resolve("B");
    await settle();
    expect(queue.getSnapshot()).toMatchObject({ scramble: "B", error: null });
  });
});
