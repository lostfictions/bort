import { Store } from "./store/store";

export interface HandlerArgs {
  message: string;
  username: string;
  channel: string;
  store: Store;
  isDM: boolean;
}
