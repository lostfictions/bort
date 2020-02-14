import { DB } from "./store/get-db";

export interface HandlerArgs {
  message: string;
  username: string;
  channel: string;
  store: DB;
  isDM: boolean;
}
