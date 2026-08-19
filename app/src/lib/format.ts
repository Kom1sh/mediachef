/**
 * The two quantities the UI prints in more than one place: a byte count and a
 * length of time.
 *
 * Both used to exist twice over. A file card spelled sizes in megabytes only
 * ("4096.0 MB" for a four-gigabyte film) while the Models screen already had a
 * gigabyte-aware version of the same function; a duration was a clock in the
 * queue's ETA (`05:30`) and a bare second count on the file card (`5400 с`, which
 * nobody reads as an hour and a half). Two spellings of one quantity is the drift
 * a shared module exists to prevent.
 *
 * The unit *words* stay out of here and arrive as arguments: "MB" is "МБ" in
 * Russian, so they belong to the dictionary, and a formatter that reached for
 * `useT` itself could not be called from anywhere but a component.
 */

/**
 * Bytes in the largest unit that keeps the number short, at roughly two or three
 * significant figures: gigabytes with one decimal from 1 GB up, whole megabytes
 * from 10 MB, megabytes with one decimal below that, and kilobytes under 1 MB.
 *
 * The kilobyte tier is what makes the small end honest — a 300 KB thumbnail and a
 * 40 KB subtitle file both read «0 МБ» when megabytes are the floor, which looks
 * like a broken probe rather than a small file. For the same reason anything with
 * bytes in it rounds up to 1 KB instead of down to zero: only a genuinely empty
 * file says 0.
 *
 * The units arrive as a named triple rather than as three positional strings —
 * with three of them in one call, an object is the difference between a swap being
 * a type error and being a silent «74 ГБ».
 *
 * Decimal units (1e9 / 1e6 / 1e3), not binary: this number sits beside the one the
 * OS shows for the same file, and the model table's own estimates are decimal too.
 */
export function size(bytes: number, units: { kb: string; mb: string; gb: string }): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} ${units.gb}`;
  if (bytes >= 1e7) return `${Math.round(bytes / 1e6)} ${units.mb}`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} ${units.mb}`;
  return `${bytes > 0 ? Math.max(1, Math.round(bytes / 1e3)) : 0} ${units.kb}`;
}

/**
 * Seconds as a clock: `mm:ss`, growing an hours field only when there is one to
 * show.
 *
 * No unit word, deliberately — a colon-separated clock is read the same way in
 * both languages, which is one dictionary key fewer and one fewer way for the
 * two locales to disagree. Negative input (a clock that has run out) clamps to
 * zero rather than printing a minus.
 */
export function duration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const ss = String(total % 60).padStart(2, "0");
  const mm = Math.floor(total / 60) % 60;
  const hh = Math.floor(total / 3600);
  return hh > 0 ? `${hh}:${String(mm).padStart(2, "0")}:${ss}` : `${String(mm).padStart(2, "0")}:${ss}`;
}
