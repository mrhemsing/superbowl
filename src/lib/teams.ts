export type TeamMeta = {
  abbr: string;
  logoPath: string; // under /public
  primary?: string;
  secondary?: string;
};

// ESPN abbreviations (mostly standard). We store logos locally after running `npm run fetch:logos`.
function logoPathForAbbr(abbr: string) {
  return `/logos/espn/${abbr.toUpperCase()}.png`;
}

// Map *historical names* (as they appear in the Super Bowl winners table) to current ESPN abbreviations.
// This makes the dataset work across relocation/rebrands.
const NAME_TO_ABBR: Record<string, string> = {
  // Current names
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",

  // Historical / alternate names
  "Washington Redskins": "WAS",
  "Washington Football Team": "WAS",
  "St. Louis Rams": "LAR",
  "Los Angeles Raiders": "LV",
  "Oakland Raiders": "LV",
  "San Diego Chargers": "LAC",
  "St. Louis Cardinals": "ARI",
  "Phoenix Cardinals": "ARI",
  "Baltimore Colts": "IND",
  "Houston Oilers": "TEN",

  // Common variants
  "Tampa Bay Bucs": "TB",
};

function normalizeName(name: string) {
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function getTeamMeta(teamName: string): TeamMeta | null {
  const name = normalizeName(teamName);
  const abbr = NAME_TO_ABBR[name];
  if (!abbr) return null;

  return {
    abbr,
    logoPath: logoPathForAbbr(abbr),
  };
}
