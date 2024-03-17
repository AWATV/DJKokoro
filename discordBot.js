const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

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
                Routes.applicationGuildCommands('724166846470815807', '1195451831149658225'),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
  });

  // Добавление слеш-команды в Discord
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

  //discordClient.on('messageCreate', async (message) => {
  //  //moved to server.js
  //});
  return discordClient;
}

module.exports = configureDiscordBot;