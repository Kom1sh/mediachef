import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { pickFiles } from "../lib/ipc";

export function DropZone({ onFiles }: { onFiles: (paths: string[]) => void }) {
  const [hover, setHover] = useState(false);
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
      className={`w-full rounded-xl border-2 border-dashed p-10 text-center text-sm ${hover ? "border-blue-500 bg-blue-500/10" : "border-neutral-600"}`}
    >
      Drop files here or click to choose
    </button>
  );
}
