# Changelog

All notable changes to the Table Math plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-30

### Added
- Initial release of Table Math plugin
- Basic SUM formula support with `=SUM()` syntax
- Column range calculations (`=SUM(A1:A5)`, `=SUM(A:A)`)
- Row range calculations (`=SUM(1:3)`)
- Individual cell calculations (`=SUM(A1,B2,C3)`)
- Arithmetic operations (`=A1+B1`, `=A1*2`, etc.)
- Auto-update calculations when table content changes
- Manual update via ribbon icon and commands
- Settings panel for customization:
  - Auto-update toggle
  - Update delay configuration
  - Formula processing toggle
- Smart number parsing from various formats (8h, $50.00, etc.)
- Error handling for invalid formulas
- Three commands available:
  - "Update table calculations"
  - "Insert SUM formula"
  - "Add total row to table"
- Support for standard markdown table syntax
- Real-time calculation updates
- Comprehensive documentation and examples

### Features
- 🧮 **Spreadsheet-like Calculations**: Add SUM formulas and arithmetic expressions to table cells
- 📊 **Auto-updating**: Calculations update automatically as you change values
- 🎯 **Easy Integration**: Works with standard markdown table syntax
- ⚡ **Real-time**: Live updates with configurable delay
- 🔧 **Customizable**: Multiple settings for fine-tuning behavior

### Technical Details
- Built with TypeScript and esbuild
- Uses Obsidian API for seamless integration
- Supports cell references using Excel-style notation (A1, B2, etc.)
- Handles edge cases like empty cells, mixed text/numbers, and invalid formulas
- Optimized for performance with debounced updates
