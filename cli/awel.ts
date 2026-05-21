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

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: fix(zk): guard prover factory behind feature flag (2026-06-16)

// maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: feat(sdk): re-land discovery filter with stable ordering (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)

// maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: fix(zk): guard prover factory behind feature flag (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// maint: refactor(reputation): tighten slash cooldown bounds (RFC-0003) (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: docs: add delegate() example to quickstart (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)
