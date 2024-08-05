/** @type {import('prettier').Options} */
export default {
  tabWidth: 2,
  arrowParens: "avoid",
  bracketSameLine: true,
  bracketSpacing: false,
  singleQuote: true,
  trailingComma: "all",
  overrides: [
    {
      files: "**/*.json",
      options: {parser: "json"}
    }
  ]
}
