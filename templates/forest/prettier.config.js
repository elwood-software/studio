/** @type {import('prettier').Options} */
module.exports = {
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
