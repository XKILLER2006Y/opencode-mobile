module.exports = {
  preset: "jest-expo",
  testMatch: ["**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // streamdown-rn + the unified/remark/micromark ecosystem ship ESM-only
  // (main: dist/index.js, type: module). jest-expo's default
  // transformIgnorePatterns ignores all of node_modules; whitelist the
  // packages so babel transforms their `export` statements instead of jest
  // choking on them.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|streamdown-rn|react-native-marked|marked|github-slugger|html-entities|remark|remark-gfm|remark-parse|remark-stringify|unified|vfile|vfile-message|micromark|micromark-.*|mdast-util-.*|unist-util-.*|bail|ccount|trough|zwitch|longest-streak|markdown-table|decode-named-character-reference|character-entities|escape-string-regexp|is-plain-obj|devlop|extend|trim-lines))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],
}