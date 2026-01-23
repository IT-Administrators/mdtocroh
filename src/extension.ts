import * as vscode from 'vscode';
import { insertTOCConfig } from './commands/inserttocconfig';
import { moveToHeading } from './commands/movetoheading';
import { updateTOC } from './commands/updatetoc';

// Minimal activate that delegates to the commands module.
export function activate(context: vscode.ExtensionContext): void {
  
    // Command: insert TOC manually (works even without config comments).
    context.subscriptions.push(
      vscode.commands.registerCommand('markdownToc.insertTOC', () =>{
        const editor = vscode.window.activeTextEditor;
    
        if (!editor || editor.document.languageId !== 'markdown') {
          vscode.window.showErrorMessage('No active Markdown editor found.');
          return;
        }
        updateTOC(editor, true); // allowWithoutConfig = true (manual) 
    }));
  
    // Command: insert default config comments.
    context.subscriptions.push(
      
      vscode.commands.registerCommand('markdownToc.insertTOCConfig', () => {
        const editor = vscode.window.activeTextEditor;

      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showErrorMessage('No active Markdown editor found.');
        return;
      }
      insertTOCConfig(editor);
    }));
  
    // Command: move to a specific heading.
    context.subscriptions.push(
      vscode.commands.registerCommand('markdownToc.moveToHeading', moveToHeading)
    );
  
    // Auto-update on save (before save actually happens) — requires config comments.
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
      if (event.document.languageId !== 'markdown') {
        return;
      }
      // Check if autoUpdateOnSave is enabled. 
      const autoUpdate = vscode.workspace.getConfiguration('markdownToc').get<boolean>('autoUpdateOnSave');
      if (!autoUpdate) {
        return;
      }
      
      const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
      if (!editor) {
        return;
      }
  
      event.waitUntil(updateTOC(editor, false)); // allowWithoutConfig = false (auto)
    }));
  
    // Auto-insert config comments when a new Markdown file is created in workspace/folder.
    context.subscriptions.push(vscode.workspace.onDidCreateFiles(async (event) => {
      const autoInsertConfig = vscode.workspace.getConfiguration('markdownToc').get<boolean>('insertConfigOnCreate');
  
      if (!autoInsertConfig) {
        return;
      }
      // Iterate over subscribed files in the event listener.
      for (const file of event.files) {
        const doc = await vscode.workspace.openTextDocument(file);
        // Check if file is a markdown file.
        if (doc.languageId !== 'markdown') {
          continue;
        }
        // Only insert if the file is empty.
        if (doc.getText().trim() !== '') {
          continue;
        }
        // Show created document in editor.
        const editor = await vscode.window.showTextDocument(doc);
        // Insert toc config.
        insertTOCConfig(editor);
      }
    }));
  
    // Auto-insert config comments for brand-new untitled Markdown buffers.
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => {
      // Check if parameter is enabled.
      const autoInsertConfig = vscode.workspace.getConfiguration('markdownToc').get<boolean>('insertConfigOnCreate');
  
      if (!autoInsertConfig) {
        return;
      }
      // Check if current document is markdown file.
      if (doc.languageId !== 'markdown') {
        return;
      }
      // Check if file is newly created.
      if (!doc.isUntitled) {
        return;
      }
      // Check if file is empty.
      if (doc.getText().trim() !== '') {
        return;
      }
  
      const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
      if (editor) {
        insertTOCConfig(editor);
      }
  }));
}

export function deactivate(): void {
  // no-op
}


