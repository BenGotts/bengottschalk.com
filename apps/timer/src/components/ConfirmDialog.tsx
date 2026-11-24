"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { answerConfirm, confirmStore } from "@/lib/confirm";
import Modal from "./Modal";

const NONE = () => null;

/**
 * The timer's confirmation dialog (see confirmAction in lib/confirm.ts).
 * The confirm button has focus, so Enter confirms; Escape or Cancel doesn't.
 */
export default function ConfirmDialog() {
  const request = useSyncExternalStore(confirmStore.subscribe, confirmStore.getSnapshot, NONE);
  const confirmButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (request) confirmButton.current?.focus();
  }, [request]);

  return (
    <Modal open={request !== null} onClose={() => answerConfirm(false)} title={request?.title ?? "Confirm"}>
      {request && (
        <div className="space-y-5">
          {request.message && <p className="text-sm text-muted">{request.message}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => answerConfirm(false)}>Cancel</button>
            <button
              ref={confirmButton}
              type="button"
              className={`btn ${request.danger ? "btn-error" : "btn-primary"}`}
              onClick={() => answerConfirm(true)}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
