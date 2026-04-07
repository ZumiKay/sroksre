import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream, TransformStream } from "stream/web";

// Polyfill TextEncoder and TextDecoder for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Polyfill ReadableStream and TransformStream for jsdom environment
global.ReadableStream = ReadableStream as typeof global.ReadableStream;
global.TransformStream = TransformStream as typeof global.TransformStream;

// Polyfill Request, Response, Headers, and fetch for jsdom environment
if (typeof global.Request === "undefined") {
  try {
    const {
      Request,
      Response,
      Headers,
      fetch,
      FormData,
      File,
      Blob,
    } = require("undici");
    global.Request = Request;
    global.Response = Response;
    global.Headers = Headers;
    global.fetch = fetch;
    global.FormData = FormData;
    global.File = File;
    global.Blob = Blob;
  } catch (error) {
    // Fallback to minimal mocks if undici is not available
    global.Request = class Request {} as any;
    global.Response = class Response {} as any;
    global.Headers = class Headers {} as any;
    global.fetch = jest.fn() as any;
    global.FormData = class FormData {} as any;
  }
}
