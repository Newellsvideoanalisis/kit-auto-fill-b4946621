export interface Player {
  id: string;
  number: string;
  name: string;
  birthDate: string;
  height: string;
  position: string;
  foot: string;
}

export interface PositionedPlayer extends Player {
  x: number;
  y: number;
}
