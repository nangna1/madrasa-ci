import Link from "next/link";
import { getT } from "@/lib/i18n/server";

const TOC = [
  { href: "#connexion", label: "Se connecter" },
  { href: "#accueil", label: "Accueil enseignant" },
  { href: "#direct", label: "Cours en direct" },
  { href: "#eleves", label: "Élèves" },
  { href: "#appel", label: "Appel" },
  { href: "#paiements", label: "Paiements" },
  { href: "#parents", label: "Parents" },
  { href: "#programme", label: "Matières et emploi du temps" },
  { href: "#eleve-espace", label: "Espace élève" },
  { href: "#federation", label: "Tableau de bord fédération" },
  { href: "#horsligne", label: "Mode hors-ligne" },
  { href: "#faq", label: "Questions fréquentes" },
];

const sectionTitle = "font-serif mb-3 mt-8 text-lg font-bold text-green-deep";
const p = "mb-3 text-[15px] leading-relaxed text-ink-soft";
const ul = "mb-3 flex flex-col gap-1.5";
const li = "flex gap-2 text-[15px] leading-relaxed text-ink-soft";
const dot = "mt-2 h-1 w-1 shrink-0 rounded-full bg-gold";

function Callout({ tone = "green", label, children }: { tone?: "green" | "warn"; label: string; children: React.ReactNode }) {
  return (
    <div
      className={`my-4 rounded-lg border p-4 text-sm ${
        tone === "warn" ? "border-terracotta-tint bg-terracotta-tint" : "border-border-soft bg-card-alt"
      }`}
      style={{ borderInlineStart: `3px solid ${tone === "warn" ? "var(--color-terracotta)" : "var(--color-green)"}` }}
    >
      <div className={`mb-1 text-[11px] font-bold uppercase tracking-[0.06em] ${tone === "warn" ? "text-terracotta" : "text-green"}`}>
        {label}
      </div>
      <div className="text-ink-soft">{children}</div>
    </div>
  );
}

export default async function GuidePage() {
  const { t } = await getT();

  return (
    <div className="min-h-screen bg-paper px-5 py-10">
      <div className="mx-auto max-w-[720px]">
        <Link href="/" className="text-[13px] text-ink-muted">
          {t("‹ Retour")}
        </Link>

        <header className="mb-8 mt-4 border-b border-border pb-8">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-green">{t("Guide d'utilisation")}</div>
          <h1 className="font-serif mb-3 text-3xl font-bold text-green-deep">Madrasa CI</h1>
          <p className="max-w-[58ch] text-[15px] text-ink-soft">
            {t(
              "Gestion quotidienne des écoles coraniques et médersas — suivi des élèves, mémorisation du Coran, présence, mensualités, communication avec les parents et cours en direct.",
            )}
          </p>
        </header>

        <nav className="mb-10 rounded-lg border border-border-soft bg-card-alt p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">{t("Sommaire")}</div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {TOC.map((item, i) => (
              <a key={item.href} href={item.href} className="flex gap-2 text-sm text-ink-soft hover:text-green">
                <span dir="ltr" className="font-serif text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t(item.label)}
              </a>
            ))}
          </div>
        </nav>

        <section id="connexion">
          <h2 className={sectionTitle}>{t("1. Se connecter")}</h2>
          <p className={p}>{t("Trois types de comptes, chacun avec son propre onglet sur l'écran de connexion :")}</p>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { role: "Enseignant", desc: "E-mail et mot de passe. Gère sa classe au quotidien." },
              { role: "Élève", desc: "Un code à 8 caractères, sans e-mail ni mot de passe." },
              { role: "Fédération", desc: "E-mail et mot de passe. Vue d'ensemble du réseau." },
            ].map((r) => (
              <div key={r.role} className="rounded-lg border border-border bg-card p-4">
                <div className="font-serif mb-1 font-bold text-green-deep">{t(r.role)}</div>
                <div className="text-[13px] text-ink-muted">{t(r.desc)}</div>
              </div>
            ))}
          </div>
          <Callout label={t("À savoir")}>
            {t("Le compte élève est généré par l'enseignant depuis la fiche de l'élève, puis transmis par WhatsApp — voir la section « Élèves ».")}
          </Callout>
        </section>

        <section id="accueil">
          <h2 className={sectionTitle}>{t("2. Accueil enseignant")}</h2>
          <p className={p}>{t("Le premier écran après connexion :")}</p>
          <ul className={ul}>
            <li className={li}><span className={dot} />{t("Chiffres clés — élèves, présents, encaissé, impayés")}</li>
            <li className={li}><span className={dot} />{t("Carte")} <strong>{t("Cours en direct")}</strong></li>
            <li className={li}><span className={dot} />{t("Carte emploi du temps du jour")}</li>
            <li className={li}><span className={dot} />{t("Bloc")} <strong>{t("À faire")}</strong> {t("(impayés, appel, mémorisation) remonté automatiquement")}</li>
          </ul>
        </section>

        <section id="direct">
          <h2 className={sectionTitle}>{t("3. Cours en direct")}</h2>
          <p className={p}>{t("Toute la classe sur une seule page, à ouvrir pendant le cours.")}</p>
          <p className="mb-1 text-sm font-semibold text-green-deep">{t("Présence et mémorisation")}</p>
          <p className={p}>{t("Boutons Présent/Absent et prochaine sourate à valider, un tap chacun.")}</p>
          <p className="mb-1 text-sm font-semibold text-green-deep">{t("Lecture en direct")}</p>
          <ul className={ul}>
            <li className={li}><span className={dot} />{t("Taper ou coller un titre et un texte (verset, extrait de fiqh, leçon d'arabe…)")}</li>
            <li className={li}><span className={dot} />{t("Joindre une image, un fichier, ou enregistrer un message vocal au micro")}</li>
            <li className={li}><span className={dot} /><strong>{t("Publier en direct")}</strong> — {t("visible instantanément chez tous les élèves connectés")}</li>
          </ul>
          <p className="mb-1 text-sm font-semibold text-green-deep">{t("Audio en direct")}</p>
          <p className={p}>
            <strong>{t("Démarrer l'audio")}</strong> {t("diffuse le micro de l'enseignant (pas de vidéo). Chaque élève clique")}{" "}
            <strong>{t("Rejoindre")}</strong> {t("pour écouter — les navigateurs bloquant la lecture automatique.")}
          </p>
          <Callout label={t("Utilisation conseillée")}>
            {t("Un seul appareil posé devant la classe fonctionne aussi bien qu'un compte par élève.")}
          </Callout>
        </section>

        <section id="eleves">
          <h2 className={sectionTitle}>{t("4. Élèves")}</h2>
          <p className={p}>
            {t("Bouton")} <strong>{t("+ Ajouter un élève")}</strong> : {t("nom, nom arabe, âge, parent — rattaché aussitôt à la classe.")}
          </p>
          <p className={p}>
            {t("Sur la fiche d'un élève : grille des 114 sourates, message au parent, encaissement, et le bloc")}{" "}
            <strong>{t("Accès élève")}</strong> {t("pour créer/régénérer son code de connexion.")}
          </p>
          <Callout tone="warn" label={t("Sécurité")}>
            {t("Le code d'accès élève ne s'affiche qu'une seule fois. Notez-le ou envoyez-le tout de suite par WhatsApp. En cas de perte, régénérez-en un nouveau.")}
          </Callout>
        </section>

        <section id="appel">
          <h2 className={sectionTitle}>{t("5. Appel")}</h2>
          <p className={p}>{t("Présence du jour, un bouton Présent/Absent par élève, avec envoi groupé aux parents des absents.")}</p>
        </section>

        <section id="paiements">
          <h2 className={sectionTitle}>{t("6. Paiements")}</h2>
          <ul className={ul}>
            <li className={li}>
              <span className={dot} />
              <strong>{t("Encaisser")}</strong> → {t("choisir l'opérateur (Orange Money, MTN Money, Wave)")} → {t("Demander le paiement")} → {t("statut « En attente »")}
            </li>
            <li className={li}>
              <span className={dot} />
              <strong>{t("Confirmer la réception")}</strong> {t("une fois l'argent reçu")} → {t("reçu généré, statut « Payé »")}
            </li>
            <li className={li}><span className={dot} />{t("Le reçu peut être envoyé au parent par WhatsApp")}</li>
          </ul>
          <Callout label={t("À savoir")}>
            {t("Demander un paiement exige une connexion active. Confirmer une réception fonctionne aussi hors-ligne.")}
          </Callout>
        </section>

        <section id="parents">
          <h2 className={sectionTitle}>{t("7. Parents")}</h2>
          <p className={p}>{t("Messages WhatsApp aux parents, à partir de modèles (absence, progrès, reçu) ou d'un texte libre.")}</p>
        </section>

        <section id="programme">
          <h2 className={sectionTitle}>{t("8. Matières et emploi du temps")}</h2>
          <p className={p}>{t("Chaque classe compose son programme parmi deux familles de matières :")}</p>
          <ul className={ul}>
            <li className={li}><span className={dot} /><strong>{t("Coraniques")}</strong> — {t("Coran, Tajwid, Tafsir, Hadith, Fiqh, Tawhid, Sira, grammaire arabe")}</li>
            <li className={li}><span className={dot} /><strong>{t("Programme national")}</strong> — {t("Français, Maths, Anglais, Découverte du monde, EDHC, AEC, EPS")}</li>
          </ul>
          <p className={p}>{t("Puis des créneaux (jour, heure, matière) composent l'emploi du temps réel.")}</p>
        </section>

        <section id="eleve-espace">
          <h2 className={sectionTitle}>{t("9. Espace élève")}</h2>
          <p className={p}>
            {t("Entièrement en lecture seule : progression Coran, présence du mois, statut de la mensualité, et la lecture/audio en direct publiés par l'enseignant, suivis automatiquement.")}
          </p>
        </section>

        <section id="federation">
          <h2 className={sectionTitle}>{t("10. Tableau de bord fédération")}</h2>
          <ul className={ul}>
            <li className={li}><span className={dot} /><strong>{t("Vue d'ensemble")}</strong> — {t("indicateurs du réseau")}</li>
            <li className={li}><span className={dot} /><strong>{t("Écoles membres")}</strong> — {t("liste, statut d'intégration, détail")}</li>
            <li className={li}><span className={dot} /><strong>{t("Plaidoyer")}</strong> — {t("export PDF pour un dossier d'intégration")}</li>
          </ul>
        </section>

        <section id="horsligne">
          <h2 className={sectionTitle}>{t("11. Mode hors-ligne")}</h2>
          <p className={p}>
            {t("Présence, mémorisation, confirmation de paiement et messages fonctionnent sans réseau, synchronisés au retour de la connexion.")}
          </p>
          <Callout tone="warn" label={t("Exception")}>
            {t("Demander un paiement et démarrer l'audio en direct exigent une connexion active.")}
          </Callout>
        </section>

        <section id="faq" className="mb-10">
          <h2 className={sectionTitle}>{t("12. Questions fréquentes")}</h2>
          <div className="flex flex-col gap-3">
            {[
              ["Le code élève est perdu", "Fiche élève → Accès élève → Régénérer le code, puis le renvoyer par WhatsApp."],
              ["Le micro ne fonctionne pas", "Vérifier l'autorisation d'accès au micro dans le navigateur."],
              ["Un élève reste « Impayé » malgré son paiement", "Vérifier si le statut est « En attente » — cliquer Confirmer la réception."],
              ["Rien ne s'affiche côté élève pendant le direct", "Vérifier côté enseignant que le statut affiche bien « En direct »."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-lg border border-border-soft bg-card p-4">
                <div className="mb-1 text-sm font-semibold text-ink">{t(q)}</div>
                <div className="text-[13px] text-ink-muted">{t(a)}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex justify-between border-t border-border pt-5 text-xs text-ink-faint">
          <span>{t("Madrasa CI — guide d'utilisation")}</span>
          <span>{t("Version française")}</span>
        </footer>
      </div>
    </div>
  );
}
