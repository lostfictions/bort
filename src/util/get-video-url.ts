import { URL } from "url";
import execa from "execa";

import { YTDL_COMMAND } from "../env";

export async function getVideoUrl(sourceUrl: string) {
  if (!YTDL_COMMAND) throw new Error("ytdl not available!");

  try {
    const url = new URL(sourceUrl);
    if (!url.protocol.startsWith("http")) {
      throw new Error(`invalid protocol for video url: "${sourceUrl}"`);
    }
  } catch (e) {
    throw new Error(`invalid video url: ${sourceUrl}`);
  }

  const execRes = (await Promise.race([
    // uhhh this is passing user input to the command line i guess
    // but hey if it's a valid whatwg url i'm sure it's fine
    execa(YTDL_COMMAND, [
      // even if we're just getting the url, ytdl complains if we don't set this
      "--restrict-filenames",
      "--socket-timeout",
      "10",
      "-g",
      sourceUrl,
    ]),
    new Promise((_, rej) => {
      setTimeout(() => rej(new Error("Maximum timeout exceeded!")), 1000 * 10);
    }),
  ])) as execa.ExecaReturnValue;

  if (!execRes.stdout || execRes.stdout.length === 0) {
    throw new Error("unexpected empty stdout");
  }
  return execRes.stdout;
}
