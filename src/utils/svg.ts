// Rewrite all id="..." declarations inside an SVG markup string with a
// per-instance prefix, and update every internal reference (url(#id),
// href="#id", xlink:href="#id") to match. This prevents id collisions when
// multiple SVGs share the document (e.g. many AI fish with <defs id="grad1">).

export function namespaceSvgIds(markup: string, prefix: string): string {
  if (!markup) return markup;
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ids = new Set<string>();
  const idRe = /\bid\s*=\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(markup)) !== null) {
    ids.add(m[1]);
  }
  if (ids.size === 0) return markup;

  let out = markup;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = `${safePrefix}-${id}`;
    // id="old" -> id="prefix-old"
    out = out.replace(new RegExp(`(\\bid\\s*=\\s*")${escaped}(")`, "g"), `$1${next}$2`);
    // url(#old) and url("#old") and url('#old')
    out = out.replace(
      new RegExp(`url\\((['"]?)#${escaped}\\1\\)`, "g"),
      `url($1#${next}$1)`,
    );
    // href="#old" and xlink:href="#old"
    out = out.replace(
      new RegExp(`((?:xlink:)?href\\s*=\\s*")#${escaped}(")`, "g"),
      `$1#${next}$2`,
    );
  }
  return out;
}
