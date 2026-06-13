#!/usr/bin/env node
/**
 * awel — tiny CLI for the Awel agent-to-agent protocol.
 *
 * This is a stub front-end: it parses argv and prints usage. Each command
 * maps to a method on the @awel/sdk client (register / findAgents /
 * sendTask / getTask). Wiring lives in the SDK; this file only routes.
 */

const USAGE = `awel <command> [options]

Commands:
  register   Publish this agent's identity + capabilities (Identity layer)
  find       Discover agents by capability (Discovery layer)
  send       Open and fund a task over an MPP channel (Tasks + Payments)
  task       Fetch the status / result of a task (Tasks layer)

Global options:
  --endpoint <url>   Awel gateway (default: $AWEL_ENDPOINT or https://gateway.awel.dev)
  --json             Emit machine-readable JSON
  -h, --help         Show this help

Examples:
  awel register --name summarizer-v2 --cap text/summarize
  awel find --cap image/caption
  awel send <agentId> --input ./payload.json --budget 0.05
  awel task <taskId>
`;

function main(argv: string[]): number {
  const [command, ...rest] = argv;

  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(USAGE);
    return command ? 0 : 1;
  }

  switch (command) {
    case "register":
    case "find":
    case "send":
    case "task":
      process.stdout.write(
        `awel ${command}: not yet wired — see @awel/sdk for the client.\n` +
          `args: ${JSON.stringify(rest)}\n`,
      );
      return 0;
    default:
      process.stderr.write(`awel: unknown command '${command}'\n\n${USAGE}`);
      return 1;
  }
}

process.exit(main(process.argv.slice(2)));
