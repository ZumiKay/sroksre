// CJS stub for prisma/generated/prisma/* to avoid import.meta.url ESM issues in Jest
const PrismaClient = jest.fn().mockImplementation(() => ({}));
const Role = { USER: "USER", ADMIN: "ADMIN", EDITOR: "EDITOR" };
const VerificationPurpose = {
  SIGNUP: "SIGNUP",
  RESET_PASSWORD: "RESET_PASSWORD",
  CHANGE_EMAIL: "CHANGE_EMAIL",
};
module.exports = { PrismaClient, Role, VerificationPurpose };

