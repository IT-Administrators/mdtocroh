# mdtocroh

*This VSCode extension creates (automated) table of contents in markdown.*

## Introduction

As im using vscode and write a lot in markdown, i decided to build an extension that creates table of contents in markdown automatically. 

This extension is easy to use and keeps every markdown file up date if configured.

## Features

This extension uses file inline configurations, implements settings via user or workspace and commands.

***Why it uses inline commands for configurations:***

Unfortunately VSCode does not support settings per file, so using inline comment configurations was the only way to apply a different configuration to each markdown file.

### Commands

- MDToc: Insert/Update Table of Contents
    - Insert a toc if none is present or updates a present toc. Changes the toc accordingly to inline comment configurations.

- MDToc: Insert TOC Config Comments
    - Inserts the inline configurations if needed. Otherwise the toc is always created on top of the file.

### Settings

- insertConfigOnCreate
    - Inserts the inline command configurations to every newly created markdown file if set to true. Default is false.

- autoUpdateOnSave
    - Automatically updates the toc or creates one if none is present. Takes the inline comment configurations into account. Default is false.

### Inline Configurations

Inline configurations are enclosed in html comments, this way they are not shown in file preview and are ignored by other markdown parsers.

- toc:insertAfterHeading
    - Insert the toc after the specified heading.

- toc:insertAfterHeadingOffset
    - Skip lines after the specified heading before inserting toc.

## Requirements

There no requirements.

## Known Issues

There are no know issues.

## Release Notes

### 0.0.1

Initial Release

---

## License

[MIT](/LICENSE)
