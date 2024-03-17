const configureDiscordBot = require('./discordBot');
const discordBotToken = 'MTIxMTMzOTIxMzg3NDY2MzQ4OQ.GbtDhu.CbFaOgt5Dnhc2jCGs8arQzVkr5OXEGIrg7tSQc';
const discordClient = configureDiscordBot(discordBotToken);

discordClient.login(discordBotToken).then(() => {
    console.log('Discord бот запущен');
});

