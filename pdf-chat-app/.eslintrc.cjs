/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["next/core-web-vitals", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "warn",
  },
};

module.exports = config;
