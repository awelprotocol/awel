/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^(\.{1,2}/.*)\.js$": "$1",
  },
  transform: {
    "^.+\.ts$": [
      "ts-jest",
      {
        isolatedModules: true,
        tsconfig: { module: "commonjs", verbatimModuleSyntax: false },
      },
    ],
  },
};
export default config;
