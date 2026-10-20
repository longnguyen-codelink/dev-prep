import { COMMANDS } from "./helpers/constants.ts";
import { Logger } from "./helpers/logger.ts";

type Command = (typeof COMMANDS)[number];

function helpText(): string {
  const lines = ["usage: pnpm cli <action> <target> [options]", "", "commands:"];
  const actions = [...new Set(COMMANDS.map((command) => command.action))];
  for (const action of actions) {
    for (const command of COMMANDS.filter((entry) => entry.action === action)) {
      lines.push(`  ${`${command.action} ${command.target}`.padEnd(18)}${command.description}`);
    }
  }
  lines.push("", "Run `pnpm cli <action> <target> --help` for the options of one command.");
  return lines.join("\n");
}

function targetsText(action: string): string {
  const lines = [`usage: pnpm cli ${action} <target> [options]`, "", "targets:"];
  for (const command of COMMANDS.filter((entry) => entry.action === action)) {
    lines.push(`  ${command.target.padEnd(18)}${command.description}`);
  }
  return lines.join("\n");
}

function commandHelpText(command: Command): string {
  return `${command.action} ${command.target}: ${command.description}\n${command.usage}`;
}

async function main(argv: string[]): Promise<number> {
  const [action, target, ...rest] = argv;
  const asksForHelp = (word: string | undefined) => word === "--help" || word === "-h";

  if (action === undefined || asksForHelp(action)) {
    console.log(helpText());
    return 0;
  }

  if (!COMMANDS.some((command) => command.action === action)) {
    Logger.error(`unknown action "${action}"`);
    console.error(`\n${helpText()}`);
    return 1;
  }

  if (target === undefined || asksForHelp(target)) {
    const asked = asksForHelp(target);
    (asked ? console.log : console.error)(targetsText(action));
    return asked ? 0 : 1;
  }

  const command = COMMANDS.find((entry) => entry.action === action && entry.target === target);
  if (!command) {
    Logger.error(`unknown target "${target}" for "${action}"`);
    console.error(`\n${targetsText(action)}`);
    return 1;
  }

  if (rest.some(asksForHelp)) {
    console.log(commandHelpText(command));
    return 0;
  }

  const module = await import(`./entrypoints/${command.file}`);
  await module.run(rest);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  },
);
