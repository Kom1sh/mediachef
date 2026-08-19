import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { JobView, ModelProgress, ModelView, ProbeInfo, Recipe } from "./types";

export const getRecipes = () => invoke<Recipe[]>("recipes");
export const probeFile = (path: string) => invoke<ProbeInfo>("probe_file", { path });
export const previewCmd = (recipeId: string, input: string, params: Record<string, string>) =>
  invoke<string[]>("preview", { recipeId, input, params });
export const enqueueJob = (recipeId: string, input: string, params: Record<string, string>) =>
  invoke<number>("enqueue", { recipeId, input, params });
export const cancelJob = (id: number) => invoke<void>("cancel", { id });
export const listJobs = () => invoke<JobView[]>("jobs");
export const onJobUpdate = (cb: (j: JobView) => void): Promise<UnlistenFn> =>
  listen<JobView>("job:update", e => cb(e.payload));
export const getModels = () => invoke<ModelView[]>("models_list");
// Resolves as soon as the download thread is started, not when it finishes: the
// rest of the story arrives on `model:progress`. The one rejection is a second
// download of an id that is already in flight.
export const downloadModel = (id: string) => invoke<void>("models_download", { id });
export const cancelModelDownload = (id: string) => invoke<void>("models_cancel_download", { id });
export const deleteModel = (id: string) => invoke<void>("models_delete", { id });
export const onModelProgress = (cb: (p: ModelProgress) => void): Promise<UnlistenFn> =>
  listen<ModelProgress>("model:progress", e => cb(e.payload));
export const pickFile = async (): Promise<string | null> => {
  const r = await open({ multiple: false });
  return typeof r === "string" ? r : null;
};
export const revealFile = (path: string) => revealItemInDir(path);
