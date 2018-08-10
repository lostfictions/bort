import { BortStore } from "./store/make-store";

export interface HandlerArgs {
  message: string;
  username: string;
  channel: string;
  store: BortStore;
  isDM: boolean;
}
