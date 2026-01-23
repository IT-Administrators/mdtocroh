import { createFenceDetector } from "./fences";

/**
 * Parse headlines from an array of lines.
 * Returns an array of { title, level, line }.
 */
export function getHeadlines(lines: string[]) {
    // Check if headline is fenced
  const isInsideFence = createFenceDetector();

  return lines
    .map((line, idx) => ({ line, idx }))
    .filter(item => {
      // Skip fenced content
      if (isInsideFence(item.line)) {
        return false;
      }
      // Only retrieve headlines
      const match = item.line.match(/^(#{1,6})\s+(.*)$/);
      if (!match) {
        return false;
      }

      const title = match[2].trim();

      // Ignore the Table of Contents heading itself.
      if (/^table of contents$/i.test(title)) {
        return false;
      }

      return true;
    })
    // Create map that contains headline info
    // Title, level, line
    .map(item => {
      const match = item.line.match(/^(#{1,6})\s+(.*)$/)!;
      return {
        title: match[2].trim(),
        level: match[1].length,
        line: item.idx
      };
    });
}