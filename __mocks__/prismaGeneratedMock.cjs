// CJS stub for prisma/generated/prisma/* to avoid import.meta.url ESM issues in Jest
const PrismaClient = jest.fn().mockImplementation(() => ({}));
module.exports = { PrismaClient };
