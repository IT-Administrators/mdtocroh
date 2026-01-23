import * as vscode from "vscode";
import { getHeadlines } from "../headlines";

export async function moveToHeading(): Promise<void> {

// Get current open window
    const editor = vscode.window.activeTextEditor;
    // Check if currently open document is of type markdown
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showErrorMessage('No active Markdown editor found.');
      return;
    }
    // Split content to array
    const lines = editor.document.getText().split(/\r?\n/);
    // Extract headlines
    const headlines = getHeadlines(lines);
    // Check if headings exist in document
    if (!headlines.length) {
      vscode.window.showInformationMessage('No headings found in the current document.');
      return;
    }
    // Create headlines map with title, description, line
    // The line attribute is needed to set position to this line
    const items = headlines.map(h => ({ label: h.title, description: `line ${h.line + 1}`, line: h.line }));
    // Create quickpick from headlines
    const selection = await vscode.window.showQuickPick(items, { placeHolder: 'Select a heading to jump to' });

    if (!selection) {
      return;
    }
    // Set cursor position to headline start
    const pos = new vscode.Position(selection.line, 0);
    const range = new vscode.Range(pos, pos);
    await vscode.window.showTextDocument(editor.document, { selection: range });
}