export type TeamMeta = {
  key: string;
  name: string;
  abbr: string;
  logoPath: string; // under /public
  primary: string;
  secondary: string;
};

// Naming convention for local assets:
//   public/logos/<key>.svg (or .png)
// where <key> is a stable slug we control.
//
// For now we only seed a couple entries; add as you go.
export const TEAMS: Record<string, TeamMeta> = {
  "Green Bay Packers": {
    key: "packers",
    name: "Green Bay Packers",
    abbr: "GB",
    logoPath: "/logos/packers.svg",
    primary: "#203731",
    secondary: "#FFB612",
  },
  "Kansas City Chiefs": {
    key: "chiefs",
    name: "Kansas City Chiefs",
    abbr: "KC",
    logoPath: "/logos/chiefs.svg",
    primary: "#E31837",
    secondary: "#FFB81C",
  },
};

export function getTeamMeta(name: string): TeamMeta | null {
  return TEAMS[name] ?? null;
}
