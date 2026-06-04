import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  // Ignore generated and config files
  {
    ignores: ["dist/**", "coverage/**", "playwright-report/**"],
  },
  // TypeScript syntax rules for all source files (no type-aware rules
  // so test files don't need their own tsconfig entry in parserOptions)
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Downgrade to warn — useful signal without breaking the scaffold
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty interfaces for forward declarations
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow unused variables/parameters prefixed with underscore (convention for
      // intentionally unused parameters in callbacks and test stubs)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
