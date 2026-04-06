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
    // Force prisma singleton to always resolve to the same file (with .ts)
    // so relative imports in src files and alias imports in tests share one cache entry
    "^@/src/lib/prisma$": "<rootDir>/src/lib/prisma.ts",
    // Redirect generated Prisma ESM client to a CJS-compatible mock so Jest
    // doesn't choke on import.meta.url inside the generated files
    "^@/prisma/generated/prisma/(.*)$": "<rootDir>/__mocks__/prismaGeneratedMock.cjs",
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
