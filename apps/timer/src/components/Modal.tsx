"use client";

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

/** A native <dialog>, so focus, Escape and the backdrop behave as expected. The timer ignores keys while one is open. */
export default function Modal({ open, onClose, title, children, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The native close event also fires when `open` turns false; only report closes the person started (Escape, the backdrop).
  const handleClose = () => {
    if (openRef.current) onClose();
  };

  return (
    <dialog ref={ref} className="modal" onClose={handleClose} aria-label={title}>
      <div className={`modal-box ${wide ? "max-w-2xl" : ""}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="btn btn-circle btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {open && children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close">close</button>
      </form>
    </dialog>
  );
}
