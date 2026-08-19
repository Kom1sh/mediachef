/** The three states the theme setting can hold — "system" follows the OS. */
export type Theme = "system" | "light" | "dark";

/**
 * Points the token palette in `index.css` at one of its three sources by way of
 * `data-theme` on `<html>`.
 *
 * "system" *removes* the attribute rather than resolving the OS preference here:
 * the `prefers-color-scheme` block in the stylesheet is keyed on the attribute
 * being absent, so the OS switching to dark at runtime repaints the app with no
 * JS involved and no listener to leak.
 */
export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = t;
}
