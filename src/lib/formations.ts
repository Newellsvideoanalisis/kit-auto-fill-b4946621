// Formation presets: positions as percentages of field area
// Each position is [x%, y%] from top-left of the field
// y: 0 = top (goalkeeper), 100 = bottom (forward)

export interface FormationPreset {
  name: string;
  positions: [number, number][]; // [x%, y%] for each of 11 players
}

export const FORMATIONS: Record<string, FormationPreset> = {
  "4-3-3": {
    name: "4-3-3",
    positions: [
      [50, 5],     // GK
      [15, 25],    // LB
      [38, 22],    // CB
      [62, 22],    // CB
      [85, 25],    // RB
      [25, 48],    // CM
      [50, 42],    // CM
      [75, 48],    // CM
      [18, 72],    // LW
      [50, 78],    // ST
      [82, 72],    // RW
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    positions: [
      [50, 5],
      [15, 25],
      [38, 22],
      [62, 22],
      [85, 25],
      [15, 50],
      [38, 46],
      [62, 46],
      [85, 50],
      [35, 75],
      [65, 75],
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    positions: [
      [50, 5],
      [25, 22],
      [50, 20],
      [75, 22],
      [10, 48],
      [32, 45],
      [50, 42],
      [68, 45],
      [90, 48],
      [35, 75],
      [65, 75],
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    positions: [
      [50, 5],
      [10, 30],
      [28, 22],
      [50, 20],
      [72, 22],
      [90, 30],
      [25, 50],
      [50, 46],
      [75, 50],
      [35, 75],
      [65, 75],
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    positions: [
      [50, 5],
      [15, 25],
      [38, 22],
      [62, 22],
      [85, 25],
      [35, 42],
      [65, 42],
      [18, 62],
      [50, 58],
      [82, 62],
      [50, 80],
    ],
  },
  "4-1-4-1": {
    name: "4-1-4-1",
    positions: [
      [50, 5],
      [15, 25],
      [38, 22],
      [62, 22],
      [85, 25],
      [50, 38],
      [15, 55],
      [38, 52],
      [62, 52],
      [85, 55],
      [50, 78],
    ],
  },
  "3-4-3": {
    name: "3-4-3",
    positions: [
      [50, 5],
      [25, 22],
      [50, 20],
      [75, 22],
      [15, 48],
      [38, 45],
      [62, 45],
      [85, 48],
      [18, 75],
      [50, 78],
      [82, 75],
    ],
  },
};

export const FORMATION_OPTIONS = Object.keys(FORMATIONS);

export function getFormationPositions(
  formation: string,
  fieldX: number,
  fieldY: number,
  fieldW: number,
  fieldH: number
): { x: number; y: number }[] {
  const preset = FORMATIONS[formation];
  if (!preset) return [];
  return preset.positions.map(([px, py]) => ({
    x: fieldX + (px / 100) * fieldW - 27, // offset for marker half-width
    y: fieldY + (py / 100) * fieldH - 30, // offset for marker half-height
  }));
}
