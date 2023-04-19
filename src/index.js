const lib = require("../lib");
const { Message, Client, GatewayIntentBits, Partials, PermissionsBitField } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("node:fs");

dotenv.config({
  path: `${__dirname}/.env`
});

const jsModelProcess = new lib.JSModelProcess({
  modelPath: `${__dirname}/../runtimes/thinkReplyer`
});

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel, Partials.Message]
});

const db = {
  get(path) {
    return JSON.parse(fs.readFileSync(`${__dirname}/config.json`, { encoding: "utf-8" }))[path]
  },
  set(path, data) {
    let json = JSON.parse(fs.readFileSync(`${__dirname}/config.json`, { encoding: "utf-8" }));
    json[path] = data;

    fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(json));
  }
}

client.once("ready", async () => {
  const data = [
    {
      name: "set",
      description: "設定を変更します。",
      options: [
        {
          type: 1,
          name: "channel",
          description: "会話するテキストチャンネルを設定します。",
          options: [
            {    
              type: 7,
              name: "channel",
              description: "会話するテキストチャンネルを指定します。",
              required: true
            }
          ] 
        },
        {
          type: 1,
          name: "delete-channel",
          description: "会話するテキストチャンネルの設定を削除します。"
        }
      ]
    }
  ];

  const command = await client.application?.commands.set(data);
  console.log("Ready!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.id === db.get(`settings.${message.guild.id}.channel.talk`)) {
    message.channel.sendTyping();
    
    const result = await jsModelProcess.interact(message.content, undefined, {
      canTrain: true
    });
    
    if (result) message.channel.send(result);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  if (interaction.commandName === "set") {
    if (!interaction.isCommand()) {
      return;
    }
    
    if (interaction.options.getSubcommand() === "channel") {
      if (interaction.member.id !== process.env.DISCORD_BOT_ADMIN) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          interaction.reply("必要な権限がありません。");
          return;
        }
      }
        
      
      const channel = interaction.options.getChannel(interaction.options.data[0].name);
      
      if (channel.type !== 0) {
        interaction.reply(`テキストチャンネルを指定してください。`);
        return;
      }

      db.set(`settings.${interaction.guild.id}.channel.talk`, channel.id);

      interaction.reply(`会話するチャンネルを指定しました。\nチャンネルID: **${channel.id}**`);
    }

    if (interaction.options.getSubcommand() === "delete-channel") {
      if (interaction.member.id !== "866083131433943050") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          interaction.reply("必要な権限がありません。");
          return;
        }
      }

      db.delete(`settings.${interaction.guild.id}.channel.talk`);
      
      interaction.reply(`会話するチャンネルの設定を削除しました。`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);