const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config()
const APPLICATION_ID = process.env.APPLICATION_ID 
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID 

function configureDiscordBot(token) {
  const commands = [
    {
      name: 'help',
      description: 'Displays a list of available commands.',
    },
  ];
  const discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  discordClient.once('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
    // Register commands
    const rest = new REST({ version: '9' }).setToken(token);

    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
  });

  discordClient.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'hello') {
      await interaction.reply('Hello!');
    } else if (commandName === 'help') {
      console.log('help')
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('primary')
            .setLabel('Primary')
            .setStyle('Primary'),
          // Add more buttons as needed
        );

      const embed = new EmbedBuilder()
        .setColor('#ff80fd')
        .setTitle('Bot Commands')
        .setDescription('List of available commands')
        .addFields(
          { name: '`/help <command>`', value: 'Displays this help message.' },
        );

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  });
  return discordClient;
}

module.exports = configureDiscordBot;