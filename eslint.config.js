import gjfleo from "@gjfleo/eslint-config";

export default gjfleo(
  {
    toml: {
      overrides: {
        "toml/quoted-keys": ["warn", { prefer: "always" }],
      },
    },
  },
  {
    files: ["packages/wiki-editor/assets/pages/零件_*Entries.js"],
    rules: {
      "style/comma-dangle": ["warn", {
        functions: "never",
      }],
      "prefer-arrow-callback": "off",
      "no-var": "off",
      "prefer-template": "off",
      "vars-on-top": "off",
      "prefer-rest-params": "off",
      "no-console": "off",
      "object-shorthand": ["error", "never"],
    },
    languageOptions: {
      ecmaVersion: 5,
    },
  },
  {
    files: ["packages/wiki-editor/assets/pages/零件_*.js"],
    languageOptions: {
      globals: { $: "readonly", mw: "readonly" },
    },
  },
);
