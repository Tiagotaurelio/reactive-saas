import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", "data/**", "node_modules/**", "docs/**", "previews/**"]
  },
  ...nextCoreWebVitals
];

export default config;
