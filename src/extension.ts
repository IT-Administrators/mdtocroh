import * as vscode from 'vscode';
import { registerCommands } from './commands';

// Minimal activate that delegates to the commands module.
export function activate(context: vscode.ExtensionContext): void {
  registerCommands(context);
}

export function deactivate(): void {
  // no-op
}


