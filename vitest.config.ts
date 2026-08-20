import { defineConfig } from "vitest/config";
import path from "path";

// Tests RLS/multi-tenant : intégration réelle contre le projet Supabase de
// dev configuré dans .env.local (voir tests/setup.ts), pas de mock ni de
// stack Supabase locale (pas de Docker dans cet environnement) — même
// approche que le projet frère atlaslab-prototype.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    // Chaque fichier gère son propre lot de données de test, mais tout
    // partage le même projet Supabase distant : éviter le parallélisme
    // entre fichiers réduit le risque de rate-limit Supabase Auth sur la
    // création d'utilisateurs.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
