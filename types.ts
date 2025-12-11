export interface Poem {
  id: number;
  kami: string; // Upper phrase (hiragana)
  shimo: string; // Lower phrase (hiragana)
}

export enum GameMode {
  KAMI_TO_SHIMO = 'KAMI_TO_SHIMO', // Upper -> Lower
  SHIMO_TO_KAMI = 'SHIMO_TO_KAMI', // Lower -> Upper
}

export enum SakasamaMode {
  OFF = 'OFF',
  ON = 'ON',
  RANDOM = 'RANDOM',
}

export interface GameStats {
  poemId: number;
  timeTaken: number;
  mistakes: number;
  lastResult: 'correct' | 'incorrect' | null;
}

export interface QueuedPoem {
  poemId: number;
  isReview: boolean;
}