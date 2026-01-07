import * as vscode from 'vscode';

// State variable.
let isUpdatingTOC = false;

/**Insert toc configuration. */
export function insertTOCConfig(editor: vscode.TextEditor): void {
  // Default configurations for the toc config.
  const defaultHeading = "";
  const defaultOffset = 0;

  const configComments =
    `<!-- toc:insertAfterHeading=${defaultHeading} -->\n` +
    `<!-- toc:insertAfterHeadingOffset=${defaultOffset} -->\n`;

  // Insert config at top of file. 
  editor.edit(editBuilder => {
    editBuilder.insert(new vscode.Position(0, 0), configComments + '\n');
  });
}

/** 
Update or insert toc.*/
export async function updateTOC(editor: vscode.TextEditor, allowWithoutConfig = false): Promise<void> {
  if (isUpdatingTOC) {
    return;
  }

  isUpdatingTOC = true;

  try {
    // Get currently open document.
    const document = editor.document;
    // Create string array by splitting content of currently open file by newline.
    const lines = document.getText().split(/\r?\n/);
    // Default values.
    // Defines the headline the toc is inserted after.
    let insertAfterHeading = "";
    // Defines the lines after the specified headline the toc is inserted into.
    let insertAfterHeadingOffset = 0;

    // Inline overrides via comments.
    for (const line of lines) {
      // Override default values with config values.
      // Filter for config values in file.
      const matchHeading = line.match(/<!--\s*toc:insertAfterHeading=(.+?)\s*-->/i);
      if (matchHeading) {
        insertAfterHeading = matchHeading[1].trim();
      }

      const matchOffset = line.match(/<!--\s*toc:insertAfterHeadingOffset=(\d+)\s*-->/i);
      if (matchOffset) {
        insertAfterHeadingOffset = parseInt(matchOffset[1], 10);
      }
    }

    // Find config block at top (scan only through the initial comment region).
    let configEndLine = -1;
    
    for (let i = 0; i < lines.length; i++) {

      if (/<!--\s*toc:insertAfterHeading/i.test(lines[i]) || /<!--\s*toc:insertAfterHeadingOffset/i.test(lines[i])) {
        configEndLine = i;

      } else {
        
        if (configEndLine !== -1) {
          break;
        }

        if (!/^\s*<!--/.test(lines[i])) {
          break; // Stop when we leave a top comment block.
        } 
      }
    }

    // Guard: auto-update requires config; manual insert can bypass.
    if (!allowWithoutConfig && configEndLine === -1 && !insertAfterHeading) {
      return;
    }

    // Default insertion line.
    // desireLine is the line where the toc should be inserted.
    // The default insertion line is 0.
    // If headline and offset are configured desiredline is:
    // Line of the specified heading + offset.
    let desiredLine = configEndLine !== -1 ? configEndLine + 1 : 0;

    // If a specific heading is set, override.
    if (insertAfterHeading) {
      const headingIndex = lines.findIndex(line => {
        // Array with all headlines.
        const match = line.match(/^(#{1,6})\s+(.*)$/);
        return match && match[2].trim().toLowerCase() === insertAfterHeading.toLowerCase();
      });
      if (headingIndex !== -1) {
        desiredLine = headingIndex + 1 + insertAfterHeadingOffset;
        
        // Append at the of the document.
        if (desiredLine > lines.length) {
          desiredLine = lines.length;
        }
      }
    }

    let isInsideFence = createFenceDetector();
    // Collect headlines.
    const headlines = lines
      .map((line, idx) => ({ line, idx }))
      .filter(item => {
        if (isInsideFence(item.line)) {
          return false; // Skip fences and their contents.
        } 
        // Array containing all headlines.
        const match = item.line.match(/^(#{1,6})\s+(.*)$/);
        
        if (!match) {
          return false;
        }
        
        const title = match[2].trim();

        if (insertAfterHeading && title.toLowerCase() === insertAfterHeading.toLowerCase()) {
          return false;
        }
        // Check if title matches string.
        if (/^table of contents$/i.test(title)) {
          return false;
        }

        return true;
      });
    // Determine headline levels.
    const levels = headlines.map(h => (h.line.match(/^(#{1,6})\s+/)![1].length));
    // Get min level.
    const minLevel = levels.length ? Math.min(...levels) : 1;
    // Create Table of Contents headline.
    const tocHeading = `${'#'.repeat(minLevel)} Table of Contents`;
    const tocLines = headlines.map(({ line }) => {
      
      const match = line.match(/^(#{1,6})\s+(.*)$/);

      if (!match) {
        return '';
      }

      const level = match[1].length;
      const title = match[2].trim();

      const anchor = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      // Calculate ident level.
      const indent = '    '.repeat(Math.max(0, level - minLevel));

      return `${indent}1. [${title}](#${anchor})`;
    }).filter(Boolean);

    if (tocLines.length === 0) {
      // If no headings found, skip inserting a TOC.
      return;
    }

    // Extra newline after TOC for readability.
    // Prefix toc with tocHeading to better filter for it.
    const tocContent = `${tocHeading}\n\n${tocLines.join('\n')}\n\n`;

    // Find toc start line.
    const tocStartLine = findTOCStart(lines);
    // Get toc end line.
    const tocEndLine = tocStartLine !== -1 ? findTOCEnd(lines, tocStartLine) : -1;

    // Delete old TOC if present.
    await editor.edit(editBuilder => {
      if (tocStartLine !== -1 && tocEndLine !== -1) {
        // Range of the old toc.
        const oldRange = new vscode.Range(
          new vscode.Position(tocStartLine, 0),
          new vscode.Position(tocEndLine + 1, 0)
        );
        // Delete old toc.
        editBuilder.delete(oldRange);
      }
    });

    // Recalculate desired line in updated doc.
    const newLines = editor.document.getText().split(/\r?\n/);
    // Endline of config.
    let newConfigEndLine = -1;

    for (let i = 0; i < newLines.length; i++) {
      // Calculate end of config.
      if (/<!--\s*toc:insertAfterHeading/i.test(newLines[i]) || /<!--\s*toc:insertAfterHeadingOffset/i.test(newLines[i])) {
        newConfigEndLine = i;
      } 
      else {

        if (newConfigEndLine !== -1) {
          break;
        }

        if (!/^\s*<!--/.test(newLines[i])) {
          break;
        }
      }
    }
    // New desired line is the line where the toc is created if the desired line was changed.
    let newDesiredLine = newConfigEndLine !== -1 ? newConfigEndLine + 1 : 0;

    if (insertAfterHeading) {
      const newHeadingIndex = newLines.findIndex(line => {
        // Create headline array.
        const match = line.match(/^(#{1,6})\s+(.*)$/);

        return match && match[2].trim().toLowerCase() === insertAfterHeading.toLowerCase();
      });

      if (newHeadingIndex !== -1) {
        newDesiredLine = newHeadingIndex + 1 + insertAfterHeadingOffset;

        if (newDesiredLine > editor.document.lineCount) {
          newDesiredLine = editor.document.lineCount;
        }
      }
    }
    // Insert udpated toc.
    await editor.edit(editBuilder => {
      editBuilder.insert(new vscode.Position(newDesiredLine, 0), tocContent);
    });
  } finally {
    isUpdatingTOC = false;
  }
}

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

// Individual exports are available — tests should import functions directly.
