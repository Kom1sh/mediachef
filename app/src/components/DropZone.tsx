import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { CookingPot } from "lucide-react";
import { useT } from "../lib/i18n";
import { pickFiles } from "../lib/ipc";

/**
 * The chopping board: the one surface a file is put on. A dashed card that goes
 * solid basil the moment a drag enters the window, and shrinks to a strip once
 * there is something on it — with files up, the board is no longer the subject of
 * the screen, only the way to add one more.
 *
 * `CookingPot` rather than an upload arrow: the pot is what the rail's Convert
 * screen is marked with, so the board reads as "this is where cooking starts"
 * instead of borrowing a web-form idiom the app has no other use for.
 */
export function DropZone({ onFiles, compact = false }: {
  onFiles: (paths: string[]) => void;
  /** With files already on the board, a ~96px strip with the invitation alone —
   *  the recipe list below is what the user is reading by then. */
  compact?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const t = useT();
  useEffect(() => {
    const un = getCurrentWebview().onDragDropEvent(e => {
      // `enter` fires once as the drag crosses into the window, `over` on every
      // move after that. Highlighting on `over` alone left the zone dark until the
      // pointer moved again — a drag brought in and held still read as a dead
      // target, which is the one moment the user is looking for confirmation.
      if (e.payload.type === "enter" || e.payload.type === "over") setHover(true);
      if (e.payload.type === "leave") setHover(false);
      if (e.payload.type === "drop") {
        setHover(false);
        // The whole drop, not `paths[0]`: the OS hands over everything the user
        // was dragging, and throwing the rest away is not something the gesture
        // asked for. App decides what is new and what is a duplicate.
        if (e.payload.paths.length > 0) onFiles(e.payload.paths);
      }
    });
    // .catch: tauri 2.11.5's unlisten script is unguarded and StrictMode double-mounts,
    // so unlisten can reject for an already-removed registry entry (upstream bug).
    return () => { un.then(f => f()).catch(() => {}); };
  }, [onFiles]);
  return (
    <button
      onClick={async () => { const ps = await pickFiles(); if (ps.length > 0) onFiles(ps); }}
      // `motion-safe:` on the lift rather than an unguarded scale utility: the
      // global reduced-motion rule in index.css can only silence the *transition*,
      // which would leave the jump instant instead of absent. The colour change
      // carries the same information without moving anything.
      className={`flex w-full shrink-0 items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${
        // `min-h`, not `h`: the strip is 96px tall on purpose, but the Russian
        // invitation wraps to two lines at the 760px minimum window and a fixed
        // height would crop the second one instead of growing for it. The padding
        // only ever shows once it does grow.
        compact ? "min-h-24 gap-3 px-4 py-3" : "flex-col gap-2 px-6 py-10"
      } ${
        hover
          ? "border-basil bg-card-2 motion-safe:scale-[1.01]"
          : "border-line bg-card hover:border-basil hover:bg-card-2 motion-safe:hover:scale-[1.01]"
      }`}
    >
      <CookingPot className="size-7 shrink-0 text-ink-2" aria-hidden />
      {/* One text block either way, so the compact board is the same sentence on
          one line rather than a second layout to keep in step. */}
      <span className="min-w-0">
        {/* Wraps rather than truncates: at the 760px minimum window the board is
            280px wide, and the Russian invitation is long enough that an ellipsis
            would eat the "or click" half of it — the half a user who cannot drag
            needs to read. Two lines still fit the 96px strip; a third grows it. */}
        <span className="block text-sm font-medium">{t("dropHint")}</span>
        {/* Dropped in the strip: 96px does not hold two lines beside a 28px pot,
            and the format list is onboarding — it has already been read by the
            time there are files on the board. */}
        {compact ? null : <span className="mt-1 block text-xs text-ink-2">{t("dropSub")}</span>}
      </span>
    </button>
  );
}
