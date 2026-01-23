/**
 * Returns true if the given line is inside a fenced code block.
 * We toggle state whenever encountering ``` or ~~~.
 */
export function createFenceDetector() {
  // Check if currently inside fenced codeblock.
  let inFence = false;

  return (line: string): boolean => {
    
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return true; // Treat fence markers themselves as "inside fence".
    }
    
    return inFence;
  };
}