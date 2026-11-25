import { describe, expect, it } from "vitest";
import { initialPadState, padReduce, type PadAction, type PadConfig, type PadResult, type PadState } from "./pad";

const plain: PadConfig = { inspection: false, holdMs: 550, memoSplit: false };

/** Runs actions in order, collecting any results. */
function run(actions: PadAction[], config: PadConfig = plain, from: PadState = initialPadState) {
  let state = from;
  const results: PadResult[] = [];
  for (const action of actions) {
    const out = padReduce(state, action, config);
    state = out.state;
    if (out.result) results.push(out.result);
  }
  return { state, results };
}

const down = (side: "left" | "right", time: number): PadAction => ({ type: "down", side, time });
const up = (side: "left" | "right", time: number): PadAction => ({ type: "up", side, time });
const tick = (time: number): PadAction => ({ type: "tick", time });

/** Both hands down at 0, green at 600, the left hand lifts at 1000. */
const start: PadAction[] = [down("left", 0), down("right", 10), tick(600), up("left", 1000), up("right", 1020)];

describe("padReduce", () => {
  it("arms only with both pads, and goes green after the hold time", () => {
    expect(run([down("left", 0)]).state.phase).toBe("idle");
    expect(run([down("left", 0), down("right", 10)]).state.phase).toBe("holding");
    expect(run([down("left", 0), down("right", 10), tick(400)]).state.phase).toBe("holding");
    expect(run([down("left", 0), down("right", 10), tick(560)]).state.phase).toBe("ready");
  });

  it("a hand lifted before green goes back to idle", () => {
    const { state } = run([down("left", 0), down("right", 10), up("right", 300), tick(600)]);
    expect(state.phase).toBe("idle");
  });

  it("starts when the first hand lifts and stops when both pads are covered", () => {
    const { state, results } = run([...start, down("left", 9000), down("right", 9012)]);
    expect(state.phase).toBe("stopped");
    expect(results).toEqual([{ timeMs: 8012, penalty: "none", memoMs: null, startedAt: 1000, endedAt: 9012 }]);
  });

  it("one pad alone doesn't stop the solve", () => {
    const { state, results } = run([...start, down("left", 5000), up("left", 5100), down("right", 6000)]);
    expect(state.phase).toBe("running");
    expect(results).toHaveLength(0);
  });

  it("a hand left on its pad at the start must be lifted and put back to stop", () => {
    // The right hand stays down when the left lifts to start.
    const early = [down("left", 0), down("right", 10), tick(600), up("left", 1000)];
    const touched = run([...early, down("left", 1200)]);
    expect(touched.state.phase).toBe("running");
    const stopped = run([...early, down("left", 1200), up("right", 3000), down("right", 7000)]);
    expect(stopped.results[0]?.timeMs).toBe(6000);
  });

  it("goes back to idle once the hands come off after a stop", () => {
    const { state } = run([...start, down("left", 9000), down("right", 9012), up("left", 9500)]);
    expect(state.phase).toBe("stopped");
    expect(run([...start, down("left", 9000), down("right", 9012), up("left", 9500), up("right", 9600)]).state.phase).toBe("idle");
  });

  it("ignores repeated touches and releases of the same pad", () => {
    const { state } = run([down("left", 0), down("left", 5), down("right", 10), up("left", 20), up("left", 25)]);
    expect(state.phase).toBe("idle");
    expect(state.down).toEqual({ left: false, right: true });
  });

  describe("inspection", () => {
    const config: PadConfig = { ...plain, inspection: true };

    it("starts when a touch is let go, then arms with both pads", () => {
      const inspecting = run([down("left", 0), up("left", 100)], config);
      expect(inspecting.state.phase).toBe("inspecting");
      expect(inspecting.state.inspectionStartedAt).toBe(100);
      const armed = run([down("left", 0), up("left", 100), down("left", 5000), down("right", 5010), tick(5600)], config);
      expect(armed.state.phase).toBe("ready");
    });

    it("a hold let go too soon goes back to inspection", () => {
      const { state } = run([down("left", 0), up("left", 100), down("left", 5000), down("right", 5010), up("left", 5200)], config);
      expect(state.phase).toBe("inspecting");
    });

    it("adds +2 after 15 seconds and DNF after 17", () => {
      const solve = (startAt: number) =>
        run([down("left", 0), up("left", 0), down("left", startAt - 1000), down("right", startAt - 1000), tick(startAt - 100), up("left", startAt), up("right", startAt), down("left", startAt + 5000), down("right", startAt + 5000)], config).results[0]?.penalty;
      expect(solve(14_000)).toBe("none");
      expect(solve(16_000)).toBe("+2");
      expect(solve(18_000)).toBe("dnf");
    });
  });

  describe("memo split", () => {
    const config: PadConfig = { ...plain, memoSplit: true };

    it("the first cover marks memo, the second (after letting go) stops", () => {
      const memo = run([...start, down("left", 31_000), down("right", 31_000)], config);
      expect(memo.state.phase).toBe("running");
      expect(memo.state.memoMs).toBe(30_000);
      // Still covered: nothing more happens until both hands come off.
      const held = run([...start, down("left", 31_000), down("right", 31_000), up("left", 31_200), down("left", 31_300)], config);
      expect(held.results).toHaveLength(0);
      const done = run([...start, down("left", 31_000), down("right", 31_000), up("left", 31_200), up("right", 31_200), down("left", 61_000), down("right", 61_000)], config);
      expect(done.results[0]).toMatchObject({ timeMs: 60_000, memoMs: 30_000 });
    });
  });

  it("cancel goes back to idle without a result", () => {
    const { state, results } = run([...start, { type: "cancel" }]);
    expect(state.phase).toBe("idle");
    expect(results).toHaveLength(0);
  });
});
