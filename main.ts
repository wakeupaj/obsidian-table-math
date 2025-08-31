import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface TableMathSettings {
	autoUpdate: boolean;
	updateDelay: number;
	allowFormulas: boolean;
	highlightCalculatedCells: boolean;
}

const DEFAULT_SETTINGS: TableMathSettings = {
	autoUpdate: true,
	updateDelay: 500,
	allowFormulas: true,
	highlightCalculatedCells: true
}

export default class TableMathPlugin extends Plugin {
	settings: TableMathSettings;
	private updateTimeout: number | null = null;
	private calculatedCells = new Set<string>();

	async onload() {
		await this.loadSettings();

		// Add ribbon icon
		const ribbonIconEl = this.addRibbonIcon('calculator', 'Table Math', (evt: MouseEvent) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				this.updateTablesInView(activeView);
				new Notice('Table calculations updated!');
			} else {
				new Notice('Please open a markdown file to use Table Math');
			}
		});
		ribbonIconEl.addClass('table-math-ribbon-class');

		// Add command to update tables
		this.addCommand({
			id: 'update-table-calculations',
			name: 'Update table calculations',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.updateTablesInEditor(editor);
				new Notice('Table calculations updated!');
			}
		});

		// Add command to insert sum formula
		this.addCommand({
			id: 'insert-sum-formula',
			name: 'Insert SUM formula',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const cursor = editor.getCursor();
				const line = editor.getLine(cursor.line);
				
				// Check if we're in a table cell
				if (this.isInTableCell(line, cursor.ch)) {
					editor.replaceSelection('=SUM()');
					// Move cursor inside parentheses
					const newCursor = editor.getCursor();
					editor.setCursor(newCursor.line, newCursor.ch - 1);
				} else {
					new Notice('Please place cursor in a table cell to insert SUM formula');
				}
			}
		});

		// Add command to create total row
		this.addCommand({
			id: 'add-total-row',
			name: 'Add total row to table',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.addTotalRowToTable(editor);
			}
		});

		// Add settings tab
		this.addSettingTab(new TableMathSettingTab(this.app, this));

		// Register event listeners
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor, view: MarkdownView) => {
				if (this.settings.autoUpdate) {
					this.scheduleUpdate(editor);
				}
			})
		);

		// Auto-update on file open
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView && this.settings.autoUpdate) {
					this.updateTablesInView(activeView);
				}
			})
		);
	}

	onunload() {
		if (this.updateTimeout) {
			window.clearTimeout(this.updateTimeout);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private scheduleUpdate(editor: Editor) {
		if (this.updateTimeout) {
			window.clearTimeout(this.updateTimeout);
		}
		
		this.updateTimeout = window.setTimeout(() => {
			this.updateTablesInEditor(editor);
		}, this.settings.updateDelay);
	}

	private updateTablesInView(view: MarkdownView) {
		const editor = view.editor;
		this.updateTablesInEditor(editor);
	}

	private updateTablesInEditor(editor: Editor) {
		const content = editor.getValue();
		const lines = content.split('\n');
		const tables = this.findTables(lines);
		
		let hasChanges = false;
		const newLines = [...lines];

		tables.forEach(table => {
			const updatedTable = this.processTable(table, lines);
			if (updatedTable.hasChanges) {
				hasChanges = true;
				// Update the lines with calculated values
				updatedTable.rows.forEach((row, rowIndex) => {
					const lineIndex = table.startLine + rowIndex;
					newLines[lineIndex] = row;
				});
			}
		});

		if (hasChanges) {
			const cursor = editor.getCursor();
			editor.setValue(newLines.join('\n'));
			editor.setCursor(cursor);
		}
	}

	private findTables(lines: string[]): Array<{startLine: number, endLine: number, rows: string[]}> {
		const tables: Array<{startLine: number, endLine: number, rows: string[]}> = [];
		let currentTable: {startLine: number, rows: string[]} | null = null;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			
			if (this.isTableRow(line)) {
				if (!currentTable) {
					currentTable = {startLine: i, rows: []};
				}
				currentTable.rows.push(lines[i]);
			} else {
				if (currentTable && currentTable.rows.length > 1) {
					// Check if we have a header separator
					const hasHeaderSep = currentTable.rows.some(row => 
						/^\s*\|[\s\-\|\:]+\|\s*$/.test(row)
					);
					if (hasHeaderSep) {
						tables.push({
							startLine: currentTable.startLine,
							endLine: i - 1,
							rows: currentTable.rows
						});
					}
				}
				currentTable = null;
			}
		}

		// Handle table at end of file
		if (currentTable && currentTable.rows.length > 1) {
			const hasHeaderSep = currentTable.rows.some(row => 
				/^\s*\|[\s\-\|\:]+\|\s*$/.test(row)
			);
			if (hasHeaderSep) {
				tables.push({
					startLine: currentTable.startLine,
					endLine: lines.length - 1,
					rows: currentTable.rows
				});
			}
		}

		return tables;
	}

	private isTableRow(line: string): boolean {
		const trimmed = line.trim();
		return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
	}

	private processTable(table: {startLine: number, endLine: number, rows: string[]}, allLines: string[]): {rows: string[], hasChanges: boolean} {
		const rows = [...table.rows];
		let hasChanges = false;

		// Parse table structure
		const parsedTable = this.parseTable(rows);
		if (!parsedTable) return {rows, hasChanges: false};

		// Process each cell for formulas
		for (let rowIndex = 0; rowIndex < parsedTable.data.length; rowIndex++) {
			for (let colIndex = 0; colIndex < parsedTable.data[rowIndex].length; colIndex++) {
				const cell = parsedTable.data[rowIndex][colIndex];
				
				if (this.settings.allowFormulas && this.isFormula(cell)) {
					const calculatedValue = this.calculateFormula(cell, parsedTable.data, rowIndex, colIndex);
					if (calculatedValue !== null && calculatedValue !== cell) {
						// Update the cell in the row
						const updatedRow = this.updateCellInRow(rows[rowIndex], colIndex, calculatedValue);
						if (updatedRow !== rows[rowIndex]) {
							rows[rowIndex] = updatedRow;
							hasChanges = true;
							this.calculatedCells.add(`${table.startLine + rowIndex}-${colIndex}`);
						}
					}
				}
			}
		}

		return {rows, hasChanges};
	}

	private parseTable(rows: string[]): {headers: string[], data: string[][]} | null {
		if (rows.length < 2) return null;

		const headerRow = this.parseTableRow(rows[0]);
		if (!headerRow) return null;

		// Find header separator
		let dataStartIndex = 1;
		for (let i = 1; i < rows.length; i++) {
			if (/^\s*\|[\s\-\|\:]+\|\s*$/.test(rows[i])) {
				dataStartIndex = i + 1;
				break;
			}
		}

		const data: string[][] = [];
		for (let i = dataStartIndex; i < rows.length; i++) {
			const rowData = this.parseTableRow(rows[i]);
			if (rowData) {
				// Ensure all rows have the same number of columns
				while (rowData.length < headerRow.length) {
					rowData.push('');
				}
				data.push(rowData);
			}
		}

		return {headers: headerRow, data};
	}

	private parseTableRow(row: string): string[] | null {
		const trimmed = row.trim();
		if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
			return null;
		}

		// Remove leading and trailing pipes, then split
		const content = trimmed.slice(1, -1);
		return content.split('|').map(cell => cell.trim());
	}

	private isFormula(cell: string): boolean {
		return cell.trim().startsWith('=');
	}

	private calculateFormula(formula: string, tableData: string[][], currentRow: number, currentCol: number): string | null {
		const trimmedFormula = formula.trim();
		
		// Handle SUM function
		const sumMatch = trimmedFormula.match(/^=SUM\(([^)]+)\)$/i);
		if (sumMatch) {
			const range = sumMatch[1].trim();
			return this.calculateSum(range, tableData, currentRow, currentCol);
		}

		// Handle basic arithmetic
		const arithMatch = trimmedFormula.match(/^=(.+)$/);
		if (arithMatch) {
			return this.calculateArithmetic(arithMatch[1], tableData, currentRow, currentCol);
		}

		return null;
	}

	private calculateSum(range: string, tableData: string[][], currentRow: number, currentCol: number): string | null {
		try {
			let values: number[] = [];

			if (range === '') {
				// Sum all numeric values in the same column above current row
				for (let row = 0; row < currentRow; row++) {
					if (currentCol < tableData[row].length) {
						const cellValue = tableData[row][currentCol];
						const numValue = this.parseNumber(cellValue);
						if (numValue !== null) {
							values.push(numValue);
						}
					}
				}
			} else if (range.includes(':')) {
				// Range like A1:A5 or 1:5 (row range) or A:A (column range)
				values = this.parseRange(range, tableData);
			} else if (range.includes(',')) {
				// Individual cells like A1,B2,C3
				const cells = range.split(',').map(cell => cell.trim());
				for (const cell of cells) {
					const value = this.getCellValue(cell, tableData, currentRow, currentCol);
					if (value !== null) {
						values.push(value);
					}
				}
			} else {
				// Single cell or column reference
				const value = this.getCellValue(range, tableData, currentRow, currentCol);
				if (value !== null) {
					values.push(value);
				}
			}

			if (values.length === 0) return '0';
			const sum = values.reduce((acc, val) => acc + val, 0);
			return this.formatNumber(sum);
		} catch (error) {
			console.error('Error calculating sum:', error);
			return '#ERROR';
		}
	}

	private calculateArithmetic(expression: string, tableData: string[][], currentRow: number, currentCol: number): string | null {
		try {
			// Replace cell references with actual values
			let processedExpression = expression;
			
			// Find cell references (like A1, B2, etc.)
			const cellRefRegex = /[A-Z]+\d+/g;
			const cellRefs = expression.match(cellRefRegex) || [];
			
			for (const cellRef of cellRefs) {
				const value = this.getCellValue(cellRef, tableData, currentRow, currentCol);
				if (value !== null) {
					processedExpression = processedExpression.replace(cellRef, value.toString());
				} else {
					processedExpression = processedExpression.replace(cellRef, '0');
				}
			}

			// Evaluate the expression safely
			const result = this.evaluateExpression(processedExpression);
			return result !== null ? this.formatNumber(result) : '#ERROR';
		} catch (error) {
			console.error('Error calculating arithmetic:', error);
			return '#ERROR';
		}
	}

	private parseRange(range: string, tableData: string[][]): number[] {
		const values: number[] = [];
		
		// Handle different range formats
		if (range.match(/^\d+:\d+$/)) {
			// Row range like 1:5
			const [startRow, endRow] = range.split(':').map(r => parseInt(r) - 1);
			for (let row = startRow; row <= endRow && row < tableData.length; row++) {
				for (const cell of tableData[row]) {
					const value = this.parseNumber(cell);
					if (value !== null) values.push(value);
				}
			}
		} else if (range.match(/^[A-Z]+:[A-Z]+$/)) {
			// Column range like A:C
			const [startCol, endCol] = range.split(':').map(this.columnToIndex);
			for (let row = 0; row < tableData.length; row++) {
				for (let col = startCol; col <= endCol && col < tableData[row].length; col++) {
					const value = this.parseNumber(tableData[row][col]);
					if (value !== null) values.push(value);
				}
			}
		} else if (range.match(/^[A-Z]+\d+:[A-Z]+\d+$/)) {
			// Cell range like A1:C5
			const [startCell, endCell] = range.split(':');
			const startPos = this.cellToPosition(startCell);
			const endPos = this.cellToPosition(endCell);
			
			if (startPos && endPos) {
				for (let row = startPos.row; row <= endPos.row && row < tableData.length; row++) {
					for (let col = startPos.col; col <= endPos.col && col < tableData[row].length; col++) {
						const value = this.parseNumber(tableData[row][col]);
						if (value !== null) values.push(value);
					}
				}
			}
		}
		
		return values;
	}

	private getCellValue(cellRef: string, tableData: string[][], currentRow: number, currentCol: number): number | null {
		if (cellRef.match(/^[A-Z]+\d+$/)) {
			// Absolute cell reference like A1, B2
			const pos = this.cellToPosition(cellRef);
			if (pos && pos.row < tableData.length && pos.col < tableData[pos.row].length) {
				return this.parseNumber(tableData[pos.row][pos.col]);
			}
		} else if (cellRef.match(/^[A-Z]+$/)) {
			// Column reference - sum entire column
			const col = this.columnToIndex(cellRef);
			let sum = 0;
			let hasValues = false;
			for (let row = 0; row < tableData.length; row++) {
				if (col < tableData[row].length) {
					const value = this.parseNumber(tableData[row][col]);
					if (value !== null) {
						sum += value;
						hasValues = true;
					}
				}
			}
			return hasValues ? sum : null;
		}
		
		return null;
	}

	private cellToPosition(cellRef: string): {row: number, col: number} | null {
		const match = cellRef.match(/^([A-Z]+)(\d+)$/);
		if (!match) return null;
		
		const col = this.columnToIndex(match[1]);
		const row = parseInt(match[2]) - 1; // Convert to 0-based
		
		return {row, col};
	}

	private columnToIndex(column: string): number {
		let result = 0;
		for (let i = 0; i < column.length; i++) {
			result = result * 26 + (column.charCodeAt(i) - 65 + 1);
		}
		return result - 1; // Convert to 0-based
	}

	private parseNumber(value: string): number | null {
		if (!value || value.trim() === '') return null;
		
		const cleaned = value.replace(/[^0-9.-]/g, '');
		if (cleaned === '' || cleaned === '-') return null;
		
		const num = parseFloat(cleaned);
		return isNaN(num) ? null : num;
	}

	private formatNumber(num: number): string {
		// Round to 2 decimal places and remove trailing zeros
		return parseFloat(num.toFixed(2)).toString();
	}

	private evaluateExpression(expr: string): number | null {
		try {
			// Very basic expression evaluator - only allow safe operations
			const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
			if (sanitized !== expr) return null;
			
			// Use Function constructor for safe evaluation
			const result = new Function('return ' + sanitized)();
			return typeof result === 'number' && !isNaN(result) ? result : null;
		} catch {
			return null;
		}
	}

	private updateCellInRow(row: string, colIndex: number, newValue: string): string {
		const cells = this.parseTableRow(row);
		if (!cells || colIndex >= cells.length) return row;
		
		cells[colIndex] = newValue;
		return '| ' + cells.join(' | ') + ' |';
	}

	private isInTableCell(line: string, charIndex: number): boolean {
		return this.isTableRow(line);
	}

	private addTotalRowToTable(editor: Editor) {
		const cursor = editor.getCursor();
		const content = editor.getValue();
		const lines = content.split('\n');
		
		// Find the table containing the cursor
		let tableStart = -1;
		let tableEnd = -1;
		
		// Look backwards for table start
		for (let i = cursor.line; i >= 0; i--) {
			if (this.isTableRow(lines[i])) {
				tableStart = i;
			} else if (tableStart !== -1) {
				tableStart = i + 1;
				break;
			}
		}
		
		// Look forwards for table end
		for (let i = cursor.line; i < lines.length; i++) {
			if (this.isTableRow(lines[i])) {
				tableEnd = i;
			} else if (tableEnd !== -1) {
				break;
			}
		}
		
		if (tableStart === -1 || tableEnd === -1) {
			new Notice('Cursor is not in a table');
			return;
		}
		
		// Parse the first data row to determine column count
		let headerRow: string[] | null = null;
		let firstDataRow: string[] | null = null;
		
		for (let i = tableStart; i <= tableEnd; i++) {
			const parsed = this.parseTableRow(lines[i]);
			if (parsed) {
				if (headerRow === null) {
					headerRow = parsed;
				} else if (/^\s*\|[\s\-\|\:]+\|\s*$/.test(lines[i])) {
					// Skip separator row
					continue;
				} else if (firstDataRow === null) {
					firstDataRow = parsed;
					break;
				}
			}
		}
		
		if (!headerRow) {
			new Notice('Could not parse table structure');
			return;
		}
		
		// Create total row
		const totalCells: string[] = [];
		for (let i = 0; i < headerRow.length; i++) {
			if (i === 0) {
				totalCells.push('**TOTAL**');
			} else {
				totalCells.push('=SUM()');
			}
		}
		
		const totalRow = '| ' + totalCells.join(' | ') + ' |';
		
		// Insert the total row
		editor.replaceRange('\n' + totalRow, {line: tableEnd, ch: lines[tableEnd].length});
		new Notice('Total row added to table');
	}
}

class TableMathSettingTab extends PluginSettingTab {
	plugin: TableMathPlugin;

	constructor(app: App, plugin: TableMathPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Table Math Settings'});

		new Setting(containerEl)
			.setName('Auto-update calculations')
			.setDesc('Automatically update table calculations when content changes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoUpdate)
				.onChange(async (value) => {
					this.plugin.settings.autoUpdate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Update delay (ms)')
			.setDesc('Delay before updating calculations after changes (in milliseconds)')
			.addSlider(slider => slider
				.setLimits(100, 2000, 100)
				.setValue(this.plugin.settings.updateDelay)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.updateDelay = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Allow formulas')
			.setDesc('Enable formula calculation (=SUM(), arithmetic expressions)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.allowFormulas)
				.onChange(async (value) => {
					this.plugin.settings.allowFormulas = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Highlight calculated cells')
			.setDesc('Visually highlight cells that contain calculated values')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.highlightCalculatedCells)
				.onChange(async (value) => {
					this.plugin.settings.highlightCalculatedCells = value;
					await this.plugin.saveSettings();
				}));

		// Add usage instructions
		containerEl.createEl('h3', {text: 'Usage Instructions'});
		
		const usageEl = containerEl.createEl('div');
		usageEl.innerHTML = `
			<p><strong>Formula Syntax:</strong></p>
			<ul>
				<li><code>=SUM()</code> - Sum all numbers in the column above</li>
				<li><code>=SUM(A1:A5)</code> - Sum cells A1 through A5</li>
				<li><code>=SUM(A:A)</code> - Sum entire column A</li>
				<li><code>=SUM(1:3)</code> - Sum all numbers in rows 1-3</li>
				<li><code>=A1+B1</code> - Add two cells</li>
				<li><code>=A1*2</code> - Multiply cell by number</li>
			</ul>
			<p><strong>Commands:</strong></p>
			<ul>
				<li>Use ribbon icon or "Update table calculations" command to manually update</li>
				<li>Use "Insert SUM formula" command to quickly add =SUM()</li>
				<li>Use "Add total row to table" command to add a complete total row</li>
			</ul>
		`;
	}
}