declare module "level" {
  import { LevelUp } from "levelup";

  namespace level {
    interface CustomEncoding {
      encode(val: any): Buffer | string;
      decode(val: Buffer | string): any;
      buffer: boolean;
      type: string;
    }

    type Encoding = string | CustomEncoding;

    interface levelUpOptions {
      createIfMissing?: boolean;
      errorIfExists?: boolean;
      compression?: boolean;
      cacheSize?: number;
      keyEncoding?: Encoding;
      valueEncoding?: Encoding;
      db?: (...args: any[]) => any;
    }

    export type Level = LevelUp;
  }

  function level(hostname: string, options?: level.levelUpOptions): LevelUp;
  export = level;
}
