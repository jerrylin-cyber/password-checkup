import md5 from "js-md5";
import { pinyin } from "pinyin-pro";

export type PasswordRules = {
  minLength: number;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  common: boolean;
};

const INITIALS: Record<string, string> = {
  zh: "5", ch: "t", sh: "g", b: "1", p: "q", m: "a", f: "z",
  d: "2", t: "w", n: "s", l: "x", g: "e", k: "d", h: "c",
  j: "r", q: "f", x: "v", r: "b", z: "y", c: "h", s: "n",
};

const FINALS: Record<string, string> = {
  a: "8", o: "i", e: "k", ai: "9", ei: "o", ao: "l", ou: ".",
  an: "0", en: "p", ang: ";", eng: "/", er: "-", i: "u", ia: "u8",
  ie: "u,", iao: "ul", iu: "u.", ian: "u0", in: "up", iang: "u;",
  ing: "u/", iong: "m/", u: "j", ua: "j8", uo: "ji", uai: "j9",
  ui: "jo", uan: "j0", un: "jp", uang: "j;", ong: "j/", v: "m",
  ve: "m,", van: "m0", vn: "mp",
};

const TONES: Record<string, string> = { "2": "6", "3": "3", "4": "4", "5": "7" };

function normalizeSyllable(raw: string) {
  let syllable = raw.toLowerCase().replaceAll("ü", "v");
  const tone = syllable.match(/[1-5]$/)?.[0] ?? "";
  syllable = syllable.replace(/[1-5]$/, "");
  const whole: Record<string, string> = {
    yi: "i", ya: "ia", yo: "io", ye: "ie", yao: "iao", you: "iu",
    yan: "ian", yin: "in", yang: "iang", ying: "ing", yong: "iong",
    yu: "v", yue: "ve", yuan: "van", yun: "vn", wu: "u", wa: "ua",
    wo: "uo", wai: "uai", wei: "ui", wan: "uan", wen: "un",
    wang: "uang", weng: "ong",
  };
  syllable = whole[syllable] ?? syllable;
  return { syllable, tone };
}

function syllableToKeyboard(raw: string) {
  const { syllable: normalized, tone } = normalizeSyllable(raw);
  let initial = "";
  let final = normalized;
  for (const candidate of ["zh", "ch", "sh", ...Object.keys(INITIALS)]) {
    if (normalized.startsWith(candidate)) {
      initial = candidate;
      final = normalized.slice(candidate.length);
      break;
    }
  }
  if (["j", "q", "x"].includes(initial) && final.startsWith("u")) final = `v${final.slice(1)}`;
  return `${INITIALS[initial] ?? ""}${FINALS[final] ?? final}${TONES[tone] ?? ""}`;
}

export function toKeyboardSuggestion(text: string) {
  if (/^[A-Za-z]+$/.test(text)) {
    const chars = Array.from(text);
    const random = seedToRandom(`english-shuffle:${text}`);
    for (let index = chars.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [chars[index], chars[target]] = [chars[target], chars[index]];
    }
    return chars.join("");
  }
  const symbolMap = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+-_?";
  return Array.from(text).map((char) => {
    if (!/[\u3400-\u9fff]/u.test(char)) {
      if (/[A-Za-z]/.test(char)) return char;
      const codePoint = char.codePointAt(0) ?? 0;
      return symbolMap[(Math.imul(codePoint, 2654435761) >>> 0) % symbolMap.length];
    }
    const reading = pinyin(char, { toneType: "num", type: "array" })[0];
    return reading ? syllableToKeyboard(reading) : char;
  }).join("");
}

function seedToRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.codePointAt(0) ?? 0;
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUPS = { uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ", lowercase: "abcdefghijkmnopqrstuvwxyz", number: "23456789", special: "!@#$%&*+-_?" };

export function passwordFromSeed(seed: string, rules: PasswordRules, variant: string) {
  const random = seedToRandom(`${seed}:${variant}`);
  const enabled = (Object.keys(GROUPS) as Array<keyof typeof GROUPS>).filter((key) => rules[key]);
  const fallback = "abcdefghijkmnopqrstuvwxyz23456789";
  const pool = enabled.map((key) => GROUPS[key]).join("") || fallback;
  const length = Math.max(rules.minLength, enabled.length);
  const chars = Array.from({ length }, () => pool[Math.floor(random() * pool.length)]);
  enabled.forEach((key, index) => { chars[index] = GROUPS[key][Math.floor(random() * GROUPS[key].length)]; });
  for (let index = chars.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [chars[index], chars[target]] = [chars[target], chars[index]];
  }
  return chars.join("");
}

export function getSuggestions(text: string, rules: PasswordRules) {
  const hash = md5(text);
  return {
    keyboard: toKeyboardSuggestion(text),
    md5Upper: hash.toUpperCase(),
    md5Lower: hash.toLowerCase(),
    fixed: passwordFromSeed(hash, rules, "fixed-rule"),
    seeded: passwordFromSeed(text, rules, "seeded-random"),
  };
}
