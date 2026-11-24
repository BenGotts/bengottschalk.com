"use client";

// Signing in with WCA, the account menu, the sync status, and the choice
// about solves made before signing in. Only rendered when sign-in is set up.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LuCloud, LuCloudAlert, LuCloudOff, LuLogOut, LuRefreshCw } from "react-icons/lu";
import { authClient, signInWithWca } from "@/lib/auth-client";
import { askAboutUnsyncedSolves, finishSignOut, prepareSignOut, resolveUnsyncedSolves, startSync, stopSync, syncNow, syncStore, type SyncState } from "@/lib/sync";
import Modal from "./Modal";

export function useSyncState(): SyncState {
  return useSyncExternalStore(syncStore.subscribe, syncStore.getSnapshot, syncStore.getSnapshot);
}

/** Watches the signed-in session and starts or stops syncing to match. Renders nothing. */
export function AccountSession() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user ?? null;
  const id = user?.id ?? null;
  const name = user?.name ?? "";
  const image = user?.image ?? null;
  const wcaId = user?.wcaId ?? null;

  useEffect(() => {
    if (isPending) return;
    if (id) void startSync({ id, name, image, wcaId });
    else stopSync();
  }, [isPending, id, name, image, wcaId]);

  return null;
}

const STATUS_TEXT: Record<SyncState["status"], string> = {
  off: "Not syncing",
  synced: "Synced",
  syncing: "Syncing…",
  offline: "Offline: changes will sync when you're back online",
  error: "Couldn't sync",
  waiting: "Waiting for you to choose what to do with this device's solves",
};

function StatusIcon({ status }: { status: SyncState["status"] }) {
  const className = "size-4";
  if (status === "syncing") return <LuRefreshCw className={`${className} animate-spin`} aria-hidden />;
  if (status === "offline") return <LuCloudOff className={`${className} text-muted`} aria-hidden />;
  if (status === "error" || status === "waiting") return <LuCloudAlert className={`${className} text-warning`} aria-hidden />;
  return <LuCloud className={`${className} text-success`} aria-hidden />;
}

async function signOut() {
  const unsynced = await prepareSignOut();
  const message = unsynced > 0
    ? `${unsynced} ${unsynced === 1 ? "change hasn't" : "changes haven't"} reached your account yet and will be lost. Sign out anyway?`
    : "Sign out? Your solves stay in your account, and this device is cleared.";
  if (!confirm(message)) return;
  await authClient.signOut();
  await finishSignOut();
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // A small remote avatar from the WCA; next/image would need its domain configured for no gain here.
    // oxlint-disable-next-line nextjs/no-img-element
    return <img src={image} alt="" className="size-6 rounded-full object-cover" />;
  }
  return <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-content" aria-hidden>{name.slice(0, 1)}</span>;
}

/** The header's account control: a sign-in button, or the account menu with the sync status. */
export function AccountButton() {
  const sync = useSyncState();
  const [busy, setBusy] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);

  // The menu closes on a click outside it or Escape.
  useEffect(() => {
    const close = (e: Event) => {
      const details = menu.current;
      if (!details?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target instanceof Node && details.contains(e.target))) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  if (!sync.user) {
    return (
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signInWithWca().finally(() => setBusy(false));
        }}
      >
        Sign in with WCA
      </button>
    );
  }

  return (
    <details ref={menu} className="dropdown dropdown-end">
      <summary className="btn btn-sm btn-ghost gap-2" aria-label={`Account: ${sync.user.name}. ${STATUS_TEXT[sync.status]}`}>
        <StatusIcon status={sync.status} />
        <Avatar name={sync.user.name} image={sync.user.image} />
      </summary>
      <div className="dropdown-content z-10 mt-2 w-72 rounded-box border border-base-300 bg-base-200 p-3 shadow-lg">
        <p className="font-medium">{sync.user.name}</p>
        {sync.user.wcaId && <p className="text-sm text-muted">{sync.user.wcaId}</p>}
        <p className="mt-3 flex items-start gap-2 text-sm">
          <StatusIcon status={sync.status} />
          <span>
            {STATUS_TEXT[sync.status]}
            {sync.status === "synced" && sync.lastSyncedAt && <span className="text-muted"> · {new Date(sync.lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
            {sync.error && <span className="block text-muted">{sync.error}</span>}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sync.status === "waiting" && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => askAboutUnsyncedSolves(true)}>Choose</button>
          )}
          <button type="button" className="btn btn-sm" onClick={() => void syncNow()} disabled={sync.status === "syncing" || sync.status === "waiting"}>
            <LuRefreshCw aria-hidden /> Sync now
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => void signOut()}>
            <LuLogOut aria-hidden /> Sign out
          </button>
        </div>
      </div>
    </details>
  );
}

/** The account part of Settings → Your data. */
export function AccountSettings() {
  const sync = useSyncState();
  if (!sync.user) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">Sign in with your WCA account to keep your solves in sync across devices.</p>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => void signInWithWca()}>Sign in with WCA</button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="flex items-center gap-2 text-xs text-muted">
        <StatusIcon status={sync.status} /> Signed in as {sync.user.name}. {STATUS_TEXT[sync.status]}.
      </p>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}

/** Asks what to do with solves this device had before signing in. */
export function UnsyncedSolvesDialog() {
  const sync = useSyncState();
  const [busy, setBusy] = useState(false);
  const open = sync.status === "waiting" && sync.askingAboutUnsynced;
  const choose = (choice: "add" | "remove") => {
    setBusy(true);
    void resolveUnsyncedSolves(choice).finally(() => setBusy(false));
  };
  const count = sync.unsyncedSolves;

  return (
    <Modal open={open} onClose={() => askAboutUnsyncedSolves(false)} title="Solves on this device">
      <div className="space-y-4">
        <p>
          This device has {count} {count === 1 ? "solve" : "solves"} that {count === 1 ? "isn't" : "aren't"} in your account yet.
          Add {count === 1 ? "it" : "them"} to your account so {count === 1 ? "it syncs" : "they sync"} across your devices?
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => choose("add")}>Add to my account</button>
          <button
            type="button"
            className="btn btn-ghost text-error"
            disabled={busy}
            onClick={() => {
              if (confirm(`Remove ${count} ${count === 1 ? "solve" : "solves"} from this device? This can't be undone.`)) choose("remove");
            }}
          >
            Remove from this device
          </button>
        </div>
        <p className="text-xs text-muted">Until you choose, nothing syncs. If you close this, you can choose later from the account menu.</p>
      </div>
    </Modal>
  );
}
