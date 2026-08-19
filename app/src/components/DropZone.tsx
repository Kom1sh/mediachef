import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { pickFile } from "../lib/ipc";

export function DropZone({ onFile }: { onFile: (path: string) => void }) {
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const un = getCurrentWebview().onDragDropEvent(e => {
      if (e.payload.type === "over") setHover(true);
      if (e.payload.type === "leave") setHover(false);
      if (e.payload.type === "drop") {
        setHover(false);
        const p = e.payload.paths[0];
        if (p) onFile(p);
      }
    });
    // .catch: tauri 2.11.5's unlisten script is unguarded and StrictMode double-mounts,
    // so unlisten can reject for an already-removed registry entry (upstream bug).
    return () => { un.then(f => f()).catch(() => {}); };
  }, [onFile]);
  return (
    <button
      onClick={async () => { const p = await pickFile(); if (p) onFile(p); }}
      className={`w-full rounded-xl border-2 border-dashed p-10 text-center text-sm ${hover ? "border-blue-500 bg-blue-500/10" : "border-neutral-600"}`}
    >
      Drop a file here or click to choose
    </button>
  );
}
