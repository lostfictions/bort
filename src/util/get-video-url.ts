import execa from "execa";

let ytdlAvailable = false;
try {
  execa.sync("which", ["ytdl"]);
  ytdlAvailable = true;
} catch (e) {
  if (
    "exitCode" in e &&
    e.exitCode === 1 &&
    e.stderr != null &&
    e.stderr.length === 0 &&
    e.command
  ) {
    console.warn(
      [
        `ytdl command not available, disabling twitter video unfold functionality.`,
        `('${e.command}' returned exit code 0, no stderr output)`,
      ].join(" ")
    );
  } else {
    console.error(
      "ytdl command not available, disabling twitter video unfold functionality.",
      "details:\n",
      e
    );
  }
}

export function getYtdlAvailable() {
  return ytdlAvailable;
}

export async function getVideoUrl(sourceUrl: string) {
  if (!ytdlAvailable) throw new Error("ytdl not available!");

  const execRes = (await Promise.race([
    // uhhh this is passing user input to the command line i guess
    // but hey cursory testing doesn't show any shell injection so wtv
    execa("ytdl", ["--socket-timeout", "10", "-g", sourceUrl]),
    new Promise((_, rej) => {
      setTimeout(() => rej(new Error("Maximum timeout exceeded!")), 1000 * 10);
    }),
  ])) as execa.ExecaReturnValue;

  if (!execRes.stdout || execRes.stdout.length === 0) {
    throw new Error("unexpected empty stdout");
  }
  return execRes.stdout;
}
