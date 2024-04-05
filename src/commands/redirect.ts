import { makeCommand } from "../util/handler";

import {
  setRedirectTwitterEnabled,
  getRedirectTwitterEnabled,
} from "../store/methods/redirect-twitter";

const USAGE = "redirect [enable|disable|on|off]";

const truthy = /(enabled?|on|true|1)/i;
const falsy = /(disabled?|off|false|0)/i;

export default makeCommand(
  {
    name: "redirect",
    description:
      "toggle posting embeddable version when unembeddable twitter links are seen",
    usage: USAGE,
  },
  async ({ message, store }): Promise<string> => {
    if (message.length === 0) {
      const enabled = await getRedirectTwitterEnabled(store);
      return `twitter redirecting is currently **${
        enabled ? "enabled" : "disabled"
      }**.`;
    }

    const trimmed = message.trim();
    if (truthy.test(trimmed)) {
      await setRedirectTwitterEnabled(store, true);
      return `twitter redirecting is now **enabled**.`;
    }
    if (falsy.test(trimmed)) {
      await setRedirectTwitterEnabled(store, false);
      return `twitter redirecting is now **disabled**.`;
    }

    return `unknown argument '${message}'.\n\nusage: ${USAGE}`;
  },
);
