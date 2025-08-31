# Table Math Plugin Test Examples

## Basic Time Tracking (Your Original Use Case)

| Day | Hours |
|-----|-------|
| Monday | 8 |
| Tuesday | 7.5 |
| Wednesday | 9 |
| Thursday | 6 |
| Friday | 4h |
| **TOTAL** | =SUM() |

## Advanced Example with Multiple Calculations

| Employee | Mon | Tue | Wed | Thu | Fri | Weekly Total | Overtime (>40h) |
|----------|-----|-----|-----|-----|-----|--------------|-----------------|
| Alice    | 8   | 8   | 8   | 8   | 8   | =SUM(B1:F1)  | =MAX(0,G1-40)   |
| Bob      | 7   | 8   | 9   | 8   | 7   | =SUM(B2:F2)  | =MAX(0,G2-40)   |
| Charlie  | 8   | 7   | 8   | 9   | 6   | =SUM(B3:F3)  | =MAX(0,G3-40)   |
| **TOTAL** | =SUM(B1:B3) | =SUM(C1:C3) | =SUM(D1:D3) | =SUM(E1:E3) | =SUM(F1:F3) | =SUM(G1:G3) | =SUM(H1:H3) |

## Simple Budget Tracker

| Category | Budgeted | Actual | Difference |
|----------|----------|--------|------------|
| Food     | 500      | 480    | =B1-C1     |
| Transport| 200      | 250    | =B2-C2     |
| Entertainment | 150 | 120    | =B3-C3     |
| **TOTAL** | =SUM()  | =SUM() | =SUM()     |

## Project Hours with Rates

| Task     | Hours | Rate | Total Cost |
|----------|-------|------|------------|
| Design   | 10    | 75   | =B1*C1     |
| Development | 25 | 80   | =B2*C2     |
| Testing  | 8     | 60   | =B3*C3     |
| **TOTAL** | =SUM() | AVG  | =SUM()     |

## Test Cases for Edge Cases

| Description | Value1 | Value2 | Result |
|-------------|--------|--------|--------|
| With text   | 5hrs   | 3.5h   | =SUM() |
| With currency | $100 | $50.25 | =SUM() |
| Empty cells |        | 10     | =SUM() |
| Mixed formats | 8.5  | 2      | =SUM() |
| **TOTAL**   | =SUM() | =SUM() | =SUM() |

## Instructions for Testing

1. Load this file in Obsidian with the Table Math plugin enabled
2. The =SUM() formulas should automatically calculate
3. Try editing any number and watch the totals update
4. Use the ribbon icon (calculator) to manually refresh calculations
5. Test the commands:
   - "Insert SUM formula" - position cursor in empty cell and run
   - "Add total row to table" - position cursor in any table and run
   - "Update table calculations" - manually refresh all calculations
