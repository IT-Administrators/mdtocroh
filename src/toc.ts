/** Find the start of the toc.
The toc starts with the following string:
"<headline lvl> Table of Contents" */
export function findTOCStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s+Table of Contents\s*$/i.test(lines[i])) {
      return i;
    }
  }

  return -1;
}

/** Find the toc end. */
export function findTOCEnd(lines: string[], start: number): number {
  let i = start + 1;

  // Skip blank lines.
  while (i < lines.length && /^\s*$/.test(lines[i])) {
    i++;
  }
  // Skip list items that match our TOC format.
  while (i < lines.length && /^\s*1\.\s+\[.*\]\(#.*\)\s*$/.test(lines[i])) {
    i++;
  }
  // One trailing blank line after list.
  if (i < lines.length && /^\s*$/.test(lines[i])) {
    i++;
  }

  return i - 1;
}