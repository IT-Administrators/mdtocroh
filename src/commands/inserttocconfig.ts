import * as vscode from "vscode";

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