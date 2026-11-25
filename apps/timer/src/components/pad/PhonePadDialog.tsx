"use client";

import { useMemo, useSyncExternalStore } from "react";
import { encode } from "uqr";
import { padUrl } from "@/lib/pad/protocol";
import type { usePhonePad } from "@/lib/pad/usePhonePad";
import Modal from "../Modal";

type PhonePad = ReturnType<typeof usePhonePad>;

const never = () => () => {};
/** This page's origin (blank while rendering on the server). */
const useOrigin = () => useSyncExternalStore(never, () => window.location.origin, () => "");

/** A QR code, drawn dark on white (so phone cameras read it in either theme). The code is written out beside it too. */
function QrCode({ text }: { text: string }) {
  const { path, size } = useMemo(() => {
    const qr = encode(text, { ecc: "M", border: 2 });
    let d = "";
    qr.data.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    }));
    return { path: d, size: qr.size };
  }, [text]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="size-48 shrink-0 rounded-field bg-white" shapeRendering="crispEdges" aria-hidden>
      <path d={path} fill="#000" />
    </svg>
  );
}

/** Pairing a phone to use as the pads: the code to scan or type, and whether it's connected. */
export default function PhonePadDialog({ open, onClose, pad }: { open: boolean; onClose: () => void; pad: PhonePad }) {
  const origin = useOrigin();
  const { code, connected, linkStatus } = pad;
  const url = code && origin ? padUrl(origin, code) : null;

  return (
    <Modal open={open} onClose={onClose} title="Use phone as timer">
      {!pad.available ? (
        <p className="text-muted">Using a phone as the timer isn’t set up on this server.</p>
      ) : !code ? (
        <div className="space-y-4">
          <p>Your phone becomes a stackmat’s two pads: put both hands down, wait for green, lift to start, and put both hands back down to stop. Times are measured on the phone, so they’re just as exact as a touch screen’s, and they’re saved here with the scramble.</p>
          <button type="button" className="btn btn-primary w-full" onClick={pad.enable}>Show a code for my phone</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
            {url && <QrCode text={url} />}
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm text-muted">Scan with your phone’s camera, or open <span className="font-medium text-base-content">{origin.replace(/^https?:\/\//, "")}/pad</span> and type</p>
              <p className="timer-digits text-4xl font-semibold tracking-[0.2em]" data-testid="pad-code">{code}</p>
              <p className="flex items-center justify-center gap-2 text-sm sm:justify-start" data-testid="pad-status">
                <span className={`size-2.5 rounded-full ${connected ? "bg-success" : linkStatus === "error" ? "bg-error" : "bg-warning"}`} aria-hidden />
                {connected ? "Phone connected" : linkStatus === "error" ? "Can’t connect. Trying again…" : linkStatus === "connecting" ? "Connecting…" : "Waiting for your phone…"}
              </p>
            </div>
          </div>
          {pad.signedIn && !connected && (
            <p className="alert alert-info alert-soft text-sm">Signed in on your phone too? Open the timer there and tap Connect: no code needed.</p>
          )}
          <p className="text-sm text-muted">Lay the phone flat, sideways if you can. Keep this tab open: the phone’s solves are saved here, to the event and session you have open. The space bar still works too.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={pad.newCode}>New code</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { pad.disable(); onClose(); }}>Stop using a phone</button>
            <button type="button" className="btn btn-sm" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
