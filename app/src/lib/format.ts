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
 * Bytes in the largest unit that keeps the number short — gigabytes from 1 GB up,
 * megabytes below that, one decimal for GB and none for MB.
 *
 * Decimal units (1e9 / 1e6), not binary: this number sits beside the one the OS
 * shows for the same file, and the model table's own estimates are decimal too.
 */
export function size(bytes: number, gb: string, mb: string): string {
  return bytes / 1e9 >= 1
    ? `${(bytes / 1e9).toFixed(1)} ${gb}`
    : `${Math.round(bytes / 1e6)} ${mb}`;
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
