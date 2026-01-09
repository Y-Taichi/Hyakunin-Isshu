// Fisher-Yates shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Split text into 3 lines for the card (5, 5, 4 or distributed)
export function splitShimoText(text: string): string[] {
  // The prompt requests lines of 5, 5, 4 logic roughly.
  // Standard Shimo is 7-7 (14 chars).
  // 14 chars split 5, 5, 4 works perfectly.
  const lines: string[] = [];
  if (text.length <= 5) {
    lines.push(text);
  } else if (text.length <= 10) {
    lines.push(text.substring(0, 5));
    lines.push(text.substring(5));
  } else {
    lines.push(text.substring(0, 5));
    lines.push(text.substring(5, 10));
    lines.push(text.substring(10));
  }
  return lines;
}

// Format Kami text for mobile: 9 chars + newline + remaining (8 chars max usually)
export function formatKamiText(text: string): string {
  if (text.length <= 9) return text;
  return text.substring(0, 9) + '\n' + text.substring(9);
}