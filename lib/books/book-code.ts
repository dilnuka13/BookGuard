/**
 * BookGuard Code Generator.
 * Creates a short, human-readable, non-sequential code for display purposes.
 * Example: BG-7F29A1
 */

const CODE_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 excluding I and O to prevent visual confusion

export function generateBookCode(): string {
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[randomIndex];
  }
  return `BG-${result}`;
}
