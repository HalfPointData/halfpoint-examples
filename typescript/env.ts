// Reads the environment and arguments without needing @types/node.
type NodeProcess = { env: Record<string, string | undefined>; argv: string[]; exit(code: number): never };

const nodeProcess = (globalThis as { process?: NodeProcess }).process;

export const env: Record<string, string | undefined> = nodeProcess?.env ?? {};

/** Command-line arguments after `tsx <script>`. */
export const args: string[] = nodeProcess?.argv.slice(2) ?? [];

/** Prints the message and exits with status 1. */
export function fail(message: string): never {
  console.error(message);
  if (nodeProcess) nodeProcess.exit(1);
  throw new Error(message);
}
