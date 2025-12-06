import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { __test } from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// test('Sample test', () => {
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(5));
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	// });

	test("Find toc start", () => {
		// Test 1: finds "Table of Contents" heading
		{
			const lines = ['# Intro', 'Some text', '## Table of Contents', 'More text'];
			const result = __test.findTOCStart(lines);
			assert.strictEqual(result, 2, 'Should return index 2 for TOC heading');
		}

		// Test 2: works with different heading levels
		{
			const lines = ['###### Table of Contents', 'Other stuff'];
			const result = __test.findTOCStart(lines);
			assert.strictEqual(result, 0, 'Should return index 0 for TOC heading');
		}

		// Test 3: case-insensitive match
		{
			const lines = ['### table of contents', 'Other section'];
			const result = __test.findTOCStart(lines);
			assert.strictEqual(result, 0, 'Should match case-insensitive heading');
		}

		// Test 4: ignores plain text "Table of Contents"
		{
			const lines = ['Table of Contents', '## Not a TOC'];
			const result = __test.findTOCStart(lines);
			assert.strictEqual(result, -1, 'Should return -1 when not a heading');
		}

		// Test 5: returns -1 if no match
		{
			const lines = ['# Intro', '## Overview'];
			const result = __test.findTOCStart(lines);
			assert.strictEqual(result, -1, 'Should return -1 when no TOC heading exists');
		}
	});
	test("Find toc end", () => {
		// Test 1: skips blank lines after start
		{
			const lines = [
				'## Table of Contents',
				'',
				'',
				'1. [Intro](#intro)',
				'Some other section'
			];
			const result = __test.findTOCEnd(lines, 0);
			// It should stop at the TOC list item (index 3)
			assert.strictEqual(result, 3, 'Should skip blank lines and end at TOC item');
		}

		// Test 2: skips multiple TOC list items
		{
			const lines = [
				'## Table of Contents',
				'',
				'1. [Intro](#intro)',
				'1. [Usage](#usage)',
				'1. [API](#api)',
				'Other section'
			];
			const result = __test.findTOCEnd(lines, 0);
			// Last TOC item is at index 4
			assert.strictEqual(result, 4, 'Should end at last TOC list item');
		}

		// Test 3: includes one trailing blank line after list
		{
			const lines = [
				'## Table of Contents',
				'1. [Intro](#intro)',
				'1. [Usage](#usage)',
				'',
				'## Next Section'
			];
			const result = __test.findTOCEnd(lines, 0);
			// Should include the trailing blank line (index 3)
			assert.strictEqual(result, 3, 'Should include one trailing blank line after list');
		}

		// Test 4: no TOC items, just blank lines
		{
			const lines = [
				'## Table of Contents',
				'',
				'',
				'## Next Section'
			];
			const result = __test.findTOCEnd(lines, 0);
			// Should stop at the last blank line (index 2)
			assert.strictEqual(result, 2, 'Should end at last blank line when no TOC items');
		}

		// Test 5: immediate next line is content (no blanks, no list)
		{
			const lines = [
				'## Table of Contents',
				'## Next Section'
			];
			const result = __test.findTOCEnd(lines, 0);
			// Should return start (0) because nothing to skip
			assert.strictEqual(result, 0, 'Should return start index when no blanks or list items');
		}
	});
});
