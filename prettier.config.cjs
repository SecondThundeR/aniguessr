/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import('prettier-plugin-tailwindcss').PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | TailwindConfig | SortImportsConfig } */
const config = {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/components/(.*)$",
    "",
    "^@/constants/(.*)$",
    "",
    "^@/hooks/(.*)$",
    "",
    "^@/layouts/(.*)$",
    "",
    "^@/pages/(.*)$",
    "",
    "^@/providers/(.*)$",
    "",
    "^@/schemas/(.*)$",
    "",
    "^@/server/(.*)$",
    "",
    "^@/styles/(.*)$",
    "",
    "^@/ui/(.*)$",
    "",
    "^@/utils/(.*)$",
    "",
    "^@/(.*)$",
    "",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.5.2",
};

module.exports = config;
