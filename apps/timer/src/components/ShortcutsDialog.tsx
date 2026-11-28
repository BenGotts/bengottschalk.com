"use client";

import { SHORTCUTS, type Shortcut } from "@/lib/shortcuts";
import Modal from "./Modal";

const GROUPS: Shortcut["group"][] = ["Last solve", "Scramble", "Screens"];

/** Every keyboard shortcut, read from the same list the handlers use. Opened with ?. */
export default function ShortcutsDialog({ open, onClose, sotdEnabled }: { open: boolean; onClose: () => void; sotdEnabled: boolean }) {
  const shown = SHORTCUTS.filter((shortcut) => sotdEnabled || !shortcut.sotdOnly);
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <div className="space-y-4">
        <p className="text-sm text-muted">Space starts and stops the timer. Shortcuts work while the timer is idle and you're not typing in a field. On a Mac, Alt is the Option key.</p>
        {GROUPS.map((group) => (
          <section key={group}>
            <h3 className="mb-1 text-sm font-semibold">{group}</h3>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm">
              {shown.filter((shortcut) => shortcut.group === group).map((shortcut) => (
                <div key={shortcut.id} className="contents">
                  <dt><kbd className="kbd kbd-sm">{shortcut.combo.label}</kbd></dt>
                  <dd>{shortcut.description}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  );
}
