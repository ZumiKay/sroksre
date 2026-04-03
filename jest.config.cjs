/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(jose|@panva/hkdf)/)"],
  moduleNameMapper: {
    // Static assets
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/fileMock.cjs",
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$":
      "<rootDir>/__mocks__/fileMock.cjs",
    // Next.js internals
    "^next/font/(.*)$": "<rootDir>/__mocks__/nextFontMock.cjs",
    "^next/navigation$": "<rootDir>/__mocks__/nextNavigationMock.cjs",
    // Project aliases
    "^jose$": "<rootDir>/node_modules/jose/dist/node/cjs/index.js",
    "^@panva/hkdf$": "<rootDir>/__mocks__/@panva/hkdf.js",
    "^@/(.*)$": "<rootDir>/$1",
    "\\.mjs$": "<rootDir>/jest.setup.ts",
  },
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/**/action*.ts",
    "!src/**/*.d.ts",
    "!src/**/types.ts",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/.claude/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.claude/"],
  watchPathIgnorePatterns: ["<rootDir>/.claude/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
};

module.exports = config;
