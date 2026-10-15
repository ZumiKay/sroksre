// CJS stub for prisma/generated/prisma/* to avoid import.meta.url ESM issues in Jest
const PrismaClient = jest.fn().mockImplementation(() => ({}));
const Role = { USER: "USER", ADMIN: "ADMIN", EDITOR: "EDITOR" };
module.exports = { PrismaClient, Role };

