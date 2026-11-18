// Manual Jest mock — kept for reference; tests use inline factory mocks via relative path
// to ensure Jest's module registry key matches session.ts's "./prisma" import.
const Prisma: Record<string, unknown> = {};
export default Prisma;
