import { randomInt } from "crypto";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*-_+=";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

const MIN_LENGTH = 12;

function pick(pool: string): string {
  return pool[randomInt(pool.length)]!;
}

function shuffle(chars: string[]): string[] {
  const arr = [...chars];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function generateStrongPassword(length = MIN_LENGTH): string {
  const size = Math.max(length, MIN_LENGTH);
  const required = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  const remaining = Array.from({ length: size - required.length }, () => pick(ALL));
  return shuffle([...required, ...remaining]).join("");
}
