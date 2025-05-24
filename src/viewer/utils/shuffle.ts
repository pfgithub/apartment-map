// src/viewer/utils/shuffle.ts
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    // Generate a random index j such that 0 <= j <= i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at indices i and j
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}