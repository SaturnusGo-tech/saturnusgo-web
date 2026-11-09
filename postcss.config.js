module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    "next/dist/compiled/postcss-flexbugs-fixes": {},
    "next/dist/compiled/postcss-preset-env": {
      browsers: ["defaults"],
      autoprefixer: { flexbox: "no-2009" },
      stage: 3,
      features: { "custom-properties": false },
    },
  },
};
