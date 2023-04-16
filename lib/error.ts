export enum PythonProcessErrorCode {
  ERR_MISSING_ARGS = "ERR_MISSING_ARGS"
}

export class PythonProcessError extends Error {
  code: PythonProcessErrorCode;

  constructor(message: string, code: PythonProcessErrorCode) {
    super(message);
    console.error("\x1b[37m\x1b[41m  __|   _ \\   _ \\    _ \\    _ \\   |\x1b[49m\x1b[0m \n\x1b[37m\x1b[41m  _|      /     /   (   |     /  _|\x1b[49m\x1b[0m \n\x1b[37m\x1b[41m ___|  _|_\\  _|_\\  \\___/   _|_\\  _)\x1b[49m\x1b[0m");

    this.name = "PythonProcessError";
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}