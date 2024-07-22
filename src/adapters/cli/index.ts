import { Command } from "commander";
import fs from "fs";
import {
  conversation,
  conversations,
  message,
  messages,
} from "adapters/signal/sqlite/database";
import { demo } from "adapters/signal/sqlite/demo";
import { formatRelative } from "date-fns";
import path from "path";
import chalk from "chalk";
import { client as WebSocketClient } from "websocket";

const cli = new Command();

cli.version("1.0.0");

// Just so we can ignore it. The "--build" option is read by `./cli` and it means "Compile typescript for this program before running it".
cli.option("--build", "Not used here, see ./cli");

const filesMustExist = (...files: string[]) => {
  files.forEach((file) => {
    if (false == fs.existsSync(file)) {
      console.error(`The file <${file}> does not exist.`);
      process.exit(1);
    }
  });
};

//
// ./cli demo ~/.config/Signal --build
//
cli.command("demo <basePath>").action(async (basePath: string) => {
  const databaseFilePath = path.join(basePath, "sql", "db.sqlite");
  const configFilePath = path.join(basePath, "config.json");

  filesMustExist(databaseFilePath, configFilePath);

  await demo({ databaseFilePath, decryptionKeyFilePath: configFilePath });
});

//
// ./cli conversations ~/.config/Signal --limit 10 --build
//
cli
  .command("conversations <basePath>")
  .usage("./cli conversations ~/.config/Signal --limit 10 --build")
  .option("-v --verbose", "Print entire message", false)
  .option("--limit <limit>", "Limit how many results", "50")
  .action(async function (basePath: string, opts) {
    const databaseFilePath = path.join(basePath, "sql", "db.sqlite");
    const configFilePath = path.join(basePath, "config.json");
    filesMustExist(databaseFilePath, configFilePath);

    const result = await conversations(
      { databaseFilePath, decryptionKeyFilePath: configFilePath },
      { limit: parseInt(opts.limit), verbose: opts.verbose }
    );

    if (opts.verbose) {
      console.log(result);
    } else {
      console.log(
        result.map((it) => {
          const name =
            it.name || it.e164 || `${it.profileName} ${it.profileFamilyName}`;
          return `conversationId="${it.id}", serviceId="${it.serviceId}" "${name}"`;
        })
      );
    }

    console.log("");
  });

//
// ./cli messages ~/.config/Signal --limit 10 --build
//
cli
  .command("messages <basePath>")
  .usage("./cli messages ~/.config/Signal --limit 10 --build")
  .option("-v --verbose", "Print entire message", false)
  .option("--limit <limit>", "Limit how many results", "1")
  .action(async function (basePath: string, opts) {
    const databaseFilePath = path.join(basePath, "sql", "db.sqlite");
    const configFilePath = path.join(basePath, "config.json");
    filesMustExist(databaseFilePath, configFilePath);

    const result = await messages(
      { databaseFilePath, decryptionKeyFilePath: configFilePath },
      { limit: parseInt(opts.limit), verbose: opts.verbose }
    );

    if (opts.verbose) {
      console.log(result);
    } else {
      console.log(
        result.map(
          (it) =>
            `[${new Date(it.timestamp)}] ${it.id} ${it.conversationId} ${
              it.body
            }`
        )
      );
    }

    console.log("");
  });

//
// ./cli conversation ~/.config/Signal d1082b29-e248-48f6-88f9-4a1553d90557 --build
//
cli
  .command("conversation <basePath> <conversationId>")
  .description("Print detail about a single conversation")
  .option("--limit <limit>", "Limit how many messages to return", "5")
  .action(async function (basePath: string, conversationId: string, opts) {
    const databaseFilePath = path.join(basePath, "sql", "db.sqlite");
    const configFilePath = path.join(basePath, "config.json");

    filesMustExist(databaseFilePath, configFilePath);

    const theConversation = await conversation(
      { databaseFilePath, decryptionKeyFilePath: configFilePath },
      { conversationId, verbose: opts.verbose, limit: opts.limit }
    );

    console.log(theConversation);
  });

//
// ./cli message ~/.config/Signal 023b80f5-6a9a-4298-b47a-2958c8dae726 --build
//
cli
  .command("message <basePath> <messageId>")
  .description("Print detail about a single message")
  .option("-v --verbose", "Print verbose json", false)
  .action(async function (basePath: string, messageId: string, opts) {
    const databaseFilePath = path.join(basePath, "sql", "db.sqlite");
    const configFilePath = path.join(basePath, "config.json");

    filesMustExist(databaseFilePath, configFilePath);

    const theMessage = await message(
      { databaseFilePath, decryptionKeyFilePath: configFilePath },
      messageId
    );

    console.log(theMessage);
  });

//
// ./cli connect --build
//
cli.command("connect").action(async () => {
  // ts/textsecure/WebSocket.ts
  const client = new WebSocketClient({
    maxReceivedFrameSize: 0x210000,
  });

  client.on("connect", console.log);
  client.on("connectFailed", console.log);

  // [!] Fails with 401 status
  client.connect(
    "wss://chat.signal.org/v1/config",
    undefined,
    undefined,
    {},
    { timeout: 20000 }
  );
});

cli.parse();

const print = (message: any, basePath: string) => {
  console.log(chalk.yellow(`id ${message.id}`));
  console.log(`Author: UNKNOWN`);
  console.log(
    `Date: ${formatRelative(new Date(message.timestamp), new Date())}`
  );

  if (message.body.length > 0) {
    console.log(`\n     ${message.body}`);
  }

  if (message.hasAttachments) {
    console.log(`\n     Attachments:\n`);

    message.attachments.forEach((attachment) => {
      console.log(
        `     ${path.join(basePath, "attachments.noindex", attachment.path)}`
      );
    });
  }

  if (message.reactions && message.reactions.length > 0) {
    console.log(`\n     Reactions:\n`);

    message.reactions.forEach((reaction) => {
      console.log(`     ${reaction.emoji}  -- ${reaction.fromId}`);
    });
  }

  if (message.quote) {
    console.log(`\n     Quote:\n`);
    console.log(message.quote);
  }

  console.log("");
};
