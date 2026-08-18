// Un compte élève n'a pas d'e-mail réel : Supabase Auth en exige un quand
// même comme identifiant unique, donc on en fabrique un à partir du code
// d'accès (jamais envoyé, jamais consulté). L'élève ne voit et ne tape que
// le code — ni "email", ni "mot de passe" ne lui sont montrés (voir /login
// et createStudentAccess). Fichier volontairement sans dépendance Supabase :
// utilisé à la fois côté serveur (création du compte) et côté client (page
// de connexion élève).

export const STUDENT_EMAIL_DOMAIN = "eleves.madrasa-ci.local";

// Exclut les caractères ambigus à l'écrit/à l'oral (0/O, 1/I/l) — le code
// est destiné à être recopié à la main par un enfant ou lu au téléphone.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateStudentCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function studentEmailFor(code: string): string {
  return `${code.trim().toUpperCase()}@${STUDENT_EMAIL_DOMAIN}`;
}
