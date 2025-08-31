# Table Math Plugin for Obsidian

Transform your Obsidian markdown tables into powerful spreadsheet-like calculators! Add automatic totals, formulas, and live calculations to any table in your notes.

## Features

🧮 **Spreadsheet-like Calculations**: Add SUM formulas and arithmetic expressions to table cells
📊 **Auto-updating**: Calculations update automatically as you change values
🎯 **Easy Integration**: Works with standard markdown table syntax
⚡ **Real-time**: Live updates with configurable delay
🔧 **Customizable**: Multiple settings for fine-tuning behavior

## Installation & Setup

### Method 1: From GitHub Releases (Recommended)

1. **Download Latest Release**: 
   - Go to the [Releases page](https://github.com/wakeupaj/obsidian-table-math/releases)
   - Download the latest `table-math.zip` file

2. **Extract to Plugins Folder**: 
   - Navigate to your Obsidian vault's plugins folder: `[Your Vault]/.obsidian/plugins/`
   - Extract the zip file here (it will create a `table-math` folder)

3. **Enable Plugin**: 
   - Open Obsidian
   - Go to Settings → Community Plugins
   - Turn off "Safe mode" if it's enabled
   - Find "Table Math" and enable it

### Method 2: Manual Installation

1. **Download Files**: Download these files from the [latest release](https://github.com/wakeupaj/obsidian-table-math/releases):
   - `main.js`
   - `manifest.json` 
   - `styles.css`

2. **Create Plugin Folder**: 
   - Navigate to `[Your Vault]/.obsidian/plugins/`
   - Create a new folder called `table-math`
   - Copy the downloaded files into this folder

3. **Enable Plugin**: Go to Settings → Community Plugins and enable "Table Math"

### Method 3: Developer Installation

For development and testing:

1. **Clone Repository**:
   ```bash
   cd [Your Vault]/.obsidian/plugins/
   git clone https://github.com/wakeupaj/obsidian-table-math.git table-math
   cd table-math
   ```

2. **Install Dependencies & Build**:
   ```bash
   npm install
   npm run build
   ```

3. **Enable in Obsidian**: Go to Settings → Community Plugins and enable "Table Math"

## Usage

### Basic SUM Formula

Create a table and add `=SUM()` to any cell to sum all numbers in that column above the current row:

```markdown
| Day     | Hours |
|---------|-------|
| Monday  | 8     |
| Tuesday | 7.5   |
| Wednesday | 9   |
| Thursday| 6     |
| **Total** | =SUM() |
```

The `=SUM()` will automatically calculate to `30.5`.

### Advanced Formula Examples

#### Column Range Sum
```markdown
| Product | Q1 | Q2 | Q3 | Q4 | Total |
|---------|----|----|----|----|-------|
| Widget  | 100| 120| 110| 130| =SUM(B1:E1) |
| Gadget  | 80 | 90 | 85 | 95 | =SUM(B2:E2) |
| **Total**| =SUM(B:B) | =SUM(C:C) | =SUM(D:D) | =SUM(E:E) | =SUM(F1:F2) |
```

#### Arithmetic Operations
```markdown
| Item    | Price | Quantity | Total |
|---------|-------|----------|-------|
| Apple   | 1.50  | 10       | =B1*C1 |
| Orange  | 2.00  | 5        | =B2*C2 |
| **Total**| =SUM(B:B) | =SUM(C:C) | =SUM(D:D) |
```

### Formula Syntax Reference

| Formula | Description | Example |
|---------|-------------|---------|
| `=SUM()` | Sum column above current cell | `=SUM()` |
| `=SUM(A1:A5)` | Sum range of cells | `=SUM(A1:A5)` |
| `=SUM(A:A)` | Sum entire column | `=SUM(A:A)` |
| `=SUM(1:3)` | Sum all numbers in rows 1-3 | `=SUM(1:3)` |
| `=SUM(A1,B2,C3)` | Sum specific cells | `=SUM(A1,B2,C3)` |
| `=A1+B1` | Add two cells | `=A1+B1` |
| `=A1*2` | Multiply by constant | `=A1*2` |
| `=(A1+B1)/2` | Complex arithmetic | `=(A1+B1)/2` |

### Commands

Access these commands via the Command Palette (Ctrl/Cmd + P):

- **Update table calculations**: Manually refresh all calculations
- **Insert SUM formula**: Insert `=SUM()` at cursor position
- **Add total row to table**: Automatically add a total row to the current table

### Ribbon Icon

Click the calculator icon (🧮) in the left ribbon to manually update all tables in the current note.

## Settings

Access plugin settings via Settings → Community Plugins → Table Math:

- **Auto-update calculations**: Enable/disable automatic updates when content changes
- **Update delay**: Adjust delay before recalculating (100-2000ms)
- **Allow formulas**: Enable/disable formula processing
- **Highlight calculated cells**: Visual highlighting for calculated values (future feature)

## Examples

### Time Tracking Table (Your Use Case)

```markdown
| Day | Hours |
|-----|-------|
| Mon | 8h    |
| Tue | 7.5h  |
| Wed | 9h    |
| Thu | 6h    |
| Fri | 4h    |
| **TOTAL** | =SUM() |
```

### Expense Tracking

```markdown
| Category | Amount | Tax | Total |
|----------|--------|-----|-------|
| Food     | 50.00  | 5   | =B1+C1 |
| Gas      | 40.00  | 4   | =B2+C2 |
| Shopping | 25.00  | 2.5 | =B3+C3 |
| **TOTAL** | =SUM() | =SUM() | =SUM() |
```

### Project Planning

```markdown
| Task | Estimated | Actual | Variance |
|------|-----------|--------|----------|
| Design | 10 | 12 | =C1-B1 |
| Code | 20 | 25 | =C2-B2 |
| Test | 8 | 6 | =C3-B3 |
| **TOTAL** | =SUM() | =SUM() | =SUM() |
```

## Tips & Best Practices

1. **Cell References**: Use Excel-style cell references (A1, B2, etc.) where A=first column, 1=first data row
2. **Number Formats**: The plugin extracts numbers from text (e.g., "8h" becomes 8, "$50.00" becomes 50)
3. **Empty Cells**: Empty cells are treated as 0 in calculations
4. **Error Handling**: Invalid formulas show "#ERROR"
5. **Performance**: Large tables with many formulas may have a slight delay in calculations

## Troubleshooting

### Plugin Not Working
1. Ensure the plugin is enabled in Settings → Community Plugins
2. Check that files are correctly placed in the plugins folder
3. Try restarting Obsidian

### Formulas Not Calculating
1. Check that "Allow formulas" is enabled in settings
2. Ensure formula syntax is correct (starts with =)
3. Verify table has proper markdown syntax with header separator

### Auto-update Not Working
1. Enable "Auto-update calculations" in settings
2. Adjust update delay if calculations seem slow
3. Manually trigger updates using the ribbon icon or command

## Development

To modify or extend the plugin:

```bash
# Install dependencies
npm install

# Start development build (watches for changes)
npm run dev

# Build for production
npm run build

# Update version
npm run version
```

## Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/wakeupaj/obsidian-table-math/issues) for bugs
- 💡 **Feature Requests**: [Suggest new features](https://github.com/wakeupaj/obsidian-table-math/issues) 
- 📖 **Documentation**: Check the [README](https://github.com/wakeupaj/obsidian-table-math/blob/main/README.md) for usage examples
- 💬 **Questions**: Use [GitHub Discussions](https://github.com/wakeupaj/obsidian-table-math/discussions) for questions

When reporting issues, please include:
- Your Obsidian version
- Plugin version
- Example table that's not working
- Expected vs actual behavior

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the [Obsidian](https://obsidian.md) community
- Inspired by spreadsheet applications like Excel and Google Sheets
- Thanks to the Obsidian team for the excellent plugin API

---

Transform your note-taking with powerful table calculations! 🚀