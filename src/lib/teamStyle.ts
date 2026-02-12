export function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function teamGradient(name: string) {
  const hue = hashToHue(name);
  const a = `hsl(${hue} 90% 60%)`;
  const b = `hsl(${(hue + 36) % 360} 90% 55%)`;
  return { a, b, hue };
}

export function teamInitials(name: string) {
  const words = name
    .replace(/\b(the|football|team)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || name.slice(0, 2).toUpperCase();
}
