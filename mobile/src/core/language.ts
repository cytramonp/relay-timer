export const languages = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
} as const;

export type Language = keyof typeof languages;
export type Messages = Readonly<Record<string, string>>;
export type Translate = (
  message: string,
  ...values: (string | number)[]
) => string;

export function readLanguage(value: unknown): Language {
  return typeof value === "string" && Object.hasOwn(languages, value)
    ? (value as Language)
    : "en";
}

export function translator(messages: Messages): Translate {
  return (message, ...values) => {
    const key = message.trim();
    if (!key) return message;
    const translated = Object.hasOwn(messages, key) ? messages[key] : key;
    return (
      message.slice(0, message.length - message.trimStart().length) +
      translated.replace(/\{(\d+)\}/g, (placeholder, index) =>
        values[Number(index)] === undefined
          ? placeholder
          : String(values[Number(index)]),
      ) +
      message.slice(message.trimEnd().length)
    );
  };
}

export function normalizeTimerSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .trim();
}

export function matchesTimerSearch(
  query: string,
  ...fields: string[]
): boolean {
  const haystack = normalizeTimerSearch(fields.join(" "));
  return normalizeTimerSearch(query)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}
