export const INGREDIENT_PAGE_SIZE = 6;
export const INSPECTION_POSITION: [number, number, number] = [0, 1.35, -1.25];

export function ingredientPage(selectedIndex: number, count: number) {
  const index = Math.max(0, Math.min(selectedIndex, count - 1));
  const start = Math.floor(index / INGREDIENT_PAGE_SIZE) * INGREDIENT_PAGE_SIZE;
  return { start, end: Math.min(start + INGREDIENT_PAGE_SIZE, count) };
}

export function ingredientOffset(index: number, count: number): [number, number, number] {
  const columns = Math.min(3, count);
  const row = Math.floor(index / columns);
  const rowCount = Math.min(columns, count - row * columns);
  const horizontal = (index % columns - (rowCount - 1) / 2) * 0.95;
  return [(horizontal + 0.8) / Math.SQRT2, 0.75 + row * 0.95, (0.8 - horizontal) / Math.SQRT2];
}
