import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Extension functions (import directly from toc).
import { findTOCStart, findTOCEnd, insertTOCConfig, updateTOC, createFenceDetector, getHeadlines } from '../toc';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// test('Sample test', () => {
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(5));
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	// });

	test("Find toc start", () => {
		// Test 1: finds "Table of Contents" heading.
		{
			const lines = ['# Intro', 'Some text', '## Table of Contents', 'More text'];
			const result = findTOCStart(lines);
			assert.strictEqual(result, 2, 'Should return index 2 for TOC heading');
		} 

		// Test 2: works with different heading levels.
		{
			const lines = ['###### Table of Contents', 'Other stuff'];
			const result = findTOCStart(lines);
			assert.strictEqual(result, 0, 'Should return index 0 for TOC heading');
		} 

		// Test 3: case-insensitive match.
		{
			const lines = ['### table of contents', 'Other section'];
			const result = findTOCStart(lines);
			assert.strictEqual(result, 0, 'Should match case-insensitive heading');
		} 

		// Test 4: ignores plain text "Table of Contents".
		{
			const lines = ['Table of Contents', '## Not a TOC'];
			const result = findTOCStart(lines);
			assert.strictEqual(result, -1, 'Should return -1 when not a heading');
		} 

		// Test 5: returns -1 if no match.
		{
			const lines = ['# Intro', '## Overview'];
			const result = findTOCStart(lines);
			assert.strictEqual(result, -1, 'Should return -1 when no TOC heading exists');
		} 
	});

	test("Find toc end", () => {
		// Test 1: skips blank lines after start.
		{
			const lines = [
				'## Table of Contents',
				'',
				'',
				'1. [Intro](#intro)',
				'Some other section'
			];
			const result = findTOCEnd(lines, 0);
			// It should stop at the TOC list item (index 3).
			assert.strictEqual(result, 3, 'Should skip blank lines and end at TOC item');
		} 

		// Test 2: skips multiple TOC list items.
		{
			const lines = [
				'## Table of Contents',
				'',
				'1. [Intro](#intro)',
				'1. [Usage](#usage)',
				'1. [API](#api)',
				'Other section'
			];
			const result = findTOCEnd(lines, 0);
			// Last TOC item is at index 4.
			assert.strictEqual(result, 4, 'Should end at last TOC list item');
		} 

		// Test 3: includes one trailing blank line after list.
		{
			const lines = [
				'## Table of Contents',
				'1. [Intro](#intro)',
				'1. [Usage](#usage)',
				'',
				'## Next Section'
			];
			const result = findTOCEnd(lines, 0);
			// Should include the trailing blank line (index 3).
			assert.strictEqual(result, 3, 'Should include one trailing blank line after list');
		} 

		// Test 4: no TOC items, just blank lines.
		{
			const lines = [
				'## Table of Contents',
				'',
				'',
				'## Next Section'
			];
			const result = findTOCEnd(lines, 0);
			// Should stop at the last blank line (index 2).
			assert.strictEqual(result, 2, 'Should end at last blank line when no TOC items');
		} 

		// Test 5: immediate next line is content (no blanks, no list).
		{
			const lines = [
				'## Table of Contents',
				'## Next Section'
			];
			const result = findTOCEnd(lines, 0);
			// Should return start (0) because nothing to skip.
			assert.strictEqual(result, 0, 'Should return start index when no blanks or list items');
		} 
	});

	test('Should insert TOC config at top of file', async () => {
		// Create a temp file.
		const tmpFile = path.join(__dirname, 'tmp_test.md');
		fs.writeFileSync(tmpFile, 'Original content\n');

		// Open in VS Code.
		const doc = await vscode.workspace.openTextDocument(tmpFile);
		const editor = await vscode.window.showTextDocument(doc);

		// Run the function.
		insertTOCConfig(editor);

		// Save and reload.
		await doc.save();
		const updated = fs.readFileSync(tmpFile, 'utf8');

		// Expected inserted text.
		const expected =
		`<!-- toc:insertAfterHeading= -->\n` +
		`<!-- toc:insertAfterHeadingOffset=0 -->\n\n`;
		
		// Check file starts with config string.
		assert.ok(updated.startsWith(expected), 'File should start with TOC config comments');

		// Cleanup.
		fs.unlinkSync(tmpFile);
	});

	test('Should insert a TOC after config block', async () => {
    // Create a temporary markdown file.
    const tmpFile = path.join(__dirname, 'tmp_update_toc.md');
	// Kind of a here string. There is no indentation as this would lead to a fail in the test.
    const initialContent = `<!-- toc:insertAfterHeading=Introduction -->
<!-- toc:insertAfterHeadingOffset=0 -->

# Introduction
Some intro text.

## Usage
Details here.

## API
API details.
`;
    fs.writeFileSync(tmpFile, initialContent);

    // Open in VS Code.
    const doc = await vscode.workspace.openTextDocument(tmpFile);
    const editor = await vscode.window.showTextDocument(doc);

    // Run the function.
    await updateTOC(editor);

    // Save and reload.
    await doc.save();
    const updated = fs.readFileSync(tmpFile, 'utf8');

    // Expected TOC heading should be present.
    assert.ok(
      updated.includes('# Table of Contents'),
      'File should contain a TOC heading'
    );

    // Expected TOC entries should be present.
    assert.ok(
      updated.includes('1. [Usage](#usage)'),
      'TOC should contain Usage entry'
    );
    assert.ok(
      updated.includes('1. [API](#api)'),
      'TOC should contain API entry'
    );

    // Cleanup.
    fs.unlinkSync(tmpFile);
  });

  test('Should not insert TOC if no headings exist', async () => {
    const tmpFile = path.join(__dirname, 'tmp_update_toc_empty.md');
    const initialContent = `<!-- toc:insertAfterHeading= -->
<!-- toc:insertAfterHeadingOffset=0 -->

Just plain text without headings.
`;
    fs.writeFileSync(tmpFile, initialContent);

    const doc = await vscode.workspace.openTextDocument(tmpFile);
    const editor = await vscode.window.showTextDocument(doc);

    await updateTOC(editor);

    await doc.save();
    const updated = fs.readFileSync(tmpFile, 'utf8');

    assert.ok(
      !updated.includes('Table of Contents'),
      'File should not contain TOC when no headings exist'
    );

    fs.unlinkSync(tmpFile);
  });
  
  test('Should ignore fenced headline', async () => {
	// Array of strings as oroginal filecontent is also splited to string array.
	const lines = [
  '```python',
  '# Fake Headline',
  '```',
  '# Real Heading'
];

	const detector = createFenceDetector();
	assert.ok(detector(lines[0]) === true, "Should not match");  // Fence start
	assert.ok(detector(lines[1]) === true, "Should not match");   // Inside fence
	assert.ok(detector(lines[2]) === true, "Should not match");   // Fence end
	assert.ok(detector(lines[3]) === false, "Should match");  // Outside fence
	});

  test('Should parse headlines and ignore TOC and fences', () => {
    const lines = [
      '<!-- toc:insertAfterHeading= -->',
      '<!-- toc:insertAfterHeadingOffset=0 -->',
      '',
      '# Intro',
      'Some text',
      '```',
      '## Not a real heading',
      '```',
      '## Usage',
      '### Details',
      '###### Table of Contents',
      '## API'
    ];

    const headlines = getHeadlines(lines);

    // Expect to find Intro (line 3, level 1), Usage (line 8, level 2), Details (line 9, level 3), API (line 11, level 2)
    assert.strictEqual(headlines.length, 4, 'Should find 4 headlines');
    assert.deepStrictEqual(headlines[0], { title: 'Intro', level: 1, line: 3 });
    assert.deepStrictEqual(headlines[1], { title: 'Usage', level: 2, line: 8 });
    assert.deepStrictEqual(headlines[2], { title: 'Details', level: 3, line: 9 });
    assert.deepStrictEqual(headlines[3], { title: 'API', level: 2, line: 11 });
  });
});
