import { URL } from "url";
import execa from "execa";

let ytdlCommand: string | null = null;
const errors = [];
try {
  execa.sync("which", ["ytdl"]);
  ytdlCommand = "ytdl";
} catch (e) {
  errors.push(e);
}

if (!ytdlCommand) {
  try {
    execa.sync("which", ["youtube-dl"]);
    ytdlCommand = "youtube-dl";
  } catch (e) {
    errors.push(e);
  }
}

if (!ytdlCommand) {
  console.warn(
    "ytdl command not available, disabling twitter video unfold functionality.",
    "details:\n",
    errors.join("\n\n")
  );
}

export function getYtdlAvailable() {
  return ytdlCommand !== null;
}

export async function getVideoUrl(sourceUrl: string) {
  if (!ytdlCommand) throw new Error("ytdl not available!");

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
    execa(ytdlCommand, ["--socket-timeout", "10", "-g", sourceUrl]),
    new Promise((_, rej) => {
      setTimeout(() => rej(new Error("Maximum timeout exceeded!")), 1000 * 10);
    }),
  ])) as execa.ExecaReturnValue;

  if (!execRes.stdout || execRes.stdout.length === 0) {
    throw new Error("unexpected empty stdout");
  }
  return execRes.stdout;
}
