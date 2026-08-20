// Mot de passe temporaire pour un compte enseignant créé par un admin
// (federation_admin ou super_admin) — voir src/app/actions/teacher-access.ts.
// Contrairement au code élève (src/lib/auth/student-code.ts, volontairement
// court et simple pour un compte à faible enjeu en lecture seule), un
// compte enseignant peut ÉCRIRE de vraies données (présence, paiements,
// messages) : mot de passe plus long, alphabet plus large (majuscules,
// minuscules, chiffres, symbole), pas pensé pour être mémorisé — juste
// transmis une fois puis changé par l'enseignant à sa convenance.
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ"; // sans 0/O/1/I/L, mêmes raisons qu'ailleurs
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%";
const ALPHABET = UPPER + LOWER + DIGITS + SYMBOLS;

function randomFrom(alphabet: string): string {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

export function generateTempPassword(length = 14): string {
  // Garantit au moins un caractère de chaque catégorie, puis complète au
  // hasard sur l'alphabet complet, puis mélange — évite qu'un mot de passe
  // "au hasard" tombe par malchance sur une seule catégorie.
  const required = [randomFrom(UPPER), randomFrom(LOWER), randomFrom(DIGITS), randomFrom(SYMBOLS)];
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => randomFrom(ALPHABET));
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
