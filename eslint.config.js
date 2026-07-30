// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "supabase/functions/**/index.ts",
      "supabase/functions/_shared/settlement-handler.ts",
      "supabase/functions/_shared/stripe-settlement.ts",
    ],
  }
]);
