// based on https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/levelup/index.d.ts

declare module "level" {
  import { EventEmitter } from "events";

  // needed for module-function pattern
  namespace level {
    interface CustomEncoding {
      encode(val: any): Buffer | string;
      decode(val: Buffer | string): any;
      buffer: boolean;
      type: string;
    }

    type Encoding = string | CustomEncoding;

    interface Batch {
      type: string;
      key: any;
      value?: any;
      keyEncoding?: Encoding;
      valueEncoding?: Encoding;
    }

    export interface LevelUp<BatchType extends Batch = Batch>
      extends EventEmitter {
      open(callback?: (error: any) => any): void;
      close(callback?: (error: any) => any): void;

      put(key: any, value: any, options?: { sync?: boolean }): Promise<void>;
      put(key: any, value: any, callback: (error: any) => any): void;
      put(
        key: any,
        value: any,
        options: { sync?: boolean },
        callback: (error: any) => any
      ): void;

      get<T = any>(
        key: any,
        options?: { keyEncoding?: Encoding; fillCache?: boolean }
      ): Promise<T>;
      get<T = any>(key: any, callback: (error: any, value: T) => any): void;
      get<T = any>(
        key: any,
        options: { keyEncoding?: Encoding; fillCache?: boolean },
        callback: (error: any, value: T) => any
      ): void;

      del(
        key: any,
        options?: { keyEncoding?: Encoding; sync?: boolean }
      ): Promise<void>;
      del(key: any, callback: (error: any) => any): void;
      del(
        key: any,
        options: { keyEncoding?: Encoding; sync?: boolean },
        callback: (error: any) => any
      ): void;

      batch(
        array: BatchType[],
        options?: {
          keyEncoding?: Encoding;
          valueEncoding?: Encoding;
          sync?: boolean;
        }
      ): Promise<void>;
      batch(
        array: BatchType[],
        options: {
          keyEncoding?: Encoding;
          valueEncoding?: Encoding;
          sync?: boolean;
        },
        callback: (error?: any) => any
      ): void;
      batch(array: BatchType[], callback: (error?: any) => any): void;
      batch(): LevelUpChain;
      isOpen(): boolean;
      isClosed(): boolean;
      createReadStream(options?: any): any;
      createKeyStream(options?: any): any;
      createValueStream(options?: any): any;
      createWriteStream(options?: any): any;
      destroy(location: string, callback?: Function): void;
      repair(location: string, callback?: Function): void;
    }

    interface LevelUpChain {
      put(key: any, value: any): LevelUpChain;
      put(key: any, value: any, options?: { sync?: boolean }): LevelUpChain;
      del(key: any): LevelUpChain;
      del(
        key: any,
        options?: { keyEncoding?: Encoding; sync?: boolean }
      ): LevelUpChain;
      clear(): LevelUpChain;
      write(): Promise<void>;
      write(callback: (error?: any) => any): void;
    }

    interface levelupOptions {
      createIfMissing?: boolean;
      errorIfExists?: boolean;
      compression?: boolean;
      cacheSize?: number;
      keyEncoding?: Encoding;
      valueEncoding?: Encoding;
      db?: (...args: any[]) => any;
    }

    // interface LevelUpConstructor {
    //   (hostname: string, options?: levelupOptions): LevelUp;
    // }
  }
  function level(
    hostname: string,
    options?: level.levelupOptions
  ): level.LevelUp;
  export = level;
}
