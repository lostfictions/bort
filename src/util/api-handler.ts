import { NextApiRequest, NextApiResponse } from "next";

export type NextApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<any>;

/**
 * A wrapper that handles sending return values and catching errors thrown from
 * API handler functions. Based on Micro.
 */
const handler = (fn: NextApiHandler) => (
  req: NextApiRequest,
  res: NextApiResponse
) => run(req, res, fn);

export default handler;

const run = (req: NextApiRequest, res: NextApiResponse, fn: NextApiHandler) =>
  new Promise((resolve) => {
    resolve(fn(req, res));
  })
    .then((val) => {
      if (val === null) {
        send(res, 204, null);
        return;
      }

      // Send value if it is not undefined, otherwise assume res.end
      // will be called later
      if (val !== undefined) {
        send(res, res.statusCode || 200, val);
      }
    })
    .catch((err) => sendError(req, res, err));

const send = (res: NextApiResponse, code: number, obj: any = null) => {
  res.statusCode = code;

  if (obj === null) {
    res.end();
    return;
  }

  if (Buffer.isBuffer(obj)) {
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/octet-stream");
    }

    res.setHeader("Content-Length", obj.length);
    res.end(obj);
    return;
  }

  let str = obj;

  if (typeof obj === "object" || typeof obj === "number") {
    // We stringify before setting the header
    // in case `JSON.stringify` throws and a
    // 500 has to be sent instead

    // the `JSON.stringify` call is split into
    // two cases as `JSON.stringify` is optimized
    // in V8 if called with only one argument
    if (process.env.NODE_ENV === "development") {
      str = JSON.stringify(obj, null, 2);
    } else {
      str = JSON.stringify(obj);
    }

    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
  }

  res.setHeader("Content-Length", Buffer.byteLength(str));
  res.end(str);
};

const sendError = (
  _req: NextApiRequest,
  res: NextApiResponse,
  errorObj: Error & { statusCode?: number }
) => {
  const { statusCode } = errorObj;
  const message = statusCode ? errorObj.message : "Internal Server Error";
  send(
    res,
    statusCode || 500,
    process.env.NODE_ENV === "development" ? errorObj.stack : message
  );
  if (errorObj instanceof Error) {
    console.error(errorObj.stack);
  } else {
    console.warn("thrown error must be an instance of Error");
  }
};
