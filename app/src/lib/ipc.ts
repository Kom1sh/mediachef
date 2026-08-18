import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { JobView, ProbeInfo, Recipe } from "./types";

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
export const pickFile = async (): Promise<string | null> => {
  const r = await open({ multiple: false });
  return typeof r === "string" ? r : null;
};
export const revealFile = (path: string) => revealItemInDir(path);
