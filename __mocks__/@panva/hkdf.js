// Mock implementation of @panva/hkdf for Jest tests
module.exports = {
  __esModule: true,
  default: jest.fn(() => Promise.resolve(Buffer.alloc(32))),
  derive: jest.fn(() => Promise.resolve(Buffer.alloc(32))),
};
