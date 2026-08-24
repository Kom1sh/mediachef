import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { AppSettings, JobView, ModelProgress, ModelView, ProbeInfo, Recipe } from "./types";

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
// Always a list, even for a one-file pick: the drop path already hands App an
// array, and two shapes for the same "here are the files" message would only mean
// two code paths in App that have to stay in step.
export const pickFiles = async (): Promise<string[]> => {
  const r = await open({ multiple: true });
  return Array.isArray(r) ? r : typeof r === "string" ? [r] : [];
};
export const revealFile = (path: string) => revealItemInDir(path);
// Read from `settings.json` rather than from a cache, so the screen cannot open
// on defaults it would then save over the user's real file.
export const getSettings = () => invoke<AppSettings>("settings_get");
// Answers with what was actually stored: Rust clamps and normalises first, so the
// caller must adopt the return value instead of assuming its own object won.
export const setSettings = (s: AppSettings) => invoke<AppSettings>("settings_set", { s });
// `null` means the user closed the dialog — not an error, and above all not a
// reason to clear the folder they had chosen before.
export const pickFolder = () => invoke<string | null>("pick_folder");
/** Язык ОС как BCP-47. Пустая строка — система не сказала. */
export const systemLocale = () => invoke<string>("system_locale");
