const configureDiscordBot = require('./discordBot');
const startWebServer = require('./webServer');
require('dotenv').config()

const TOKEN = process.env.TOKEN 

const discordClient = configureDiscordBot(TOKEN);
discordClient.login(TOKEN).then(() => {console.log('Discord бот запущен');});
const WebClient = startWebServer();

discordClient.on('voiceStateUpdate', async (oldState, newState) => {
    if (!newState.guild) {
        console.log("Guild not found in newState");
        return;
    }

    const user = await discordClient.users.fetch(newState.id);
    const member = newState.guild.members.cache.get(user.id);
    if (!member) {
        console.log("Member not found in guild");
        return;
    }

    if (newState.channel && newState.channel.id === '1218952948294352916') {
        const channel = await newState.guild.channels.create({
            type: 2,
            parent: newState.channel.parent,
            name: `Приватний канал для ${user.tag}`
        })
        member.voice.setChannel(channel);
        channel.send({embeds: [
            {
                color: 0x0099ff,
                title: `Вітаємо ${user.tag}!`,
                description: 'Ось твої налаштування!'
            }
        ],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: 'Назвати',
                        custom_id: 'edit',
                        emoji: '✏️'
                    },
                    {
                        type: 2,
                        style: 2,
                        label: 'Доступ',
                        custom_id: 'access',
                        emoji: '👥'
                    },
                    {
                        type: 2,
                        style: 2,
                        label: 'Кік',
                        custom_id: 'kick',
                        emoji: '👟'
                    }
                ]
            },{
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: 'Всі',
                        custom_id: 'public',
                        emoji: '🌐'
                    },
                    {
                        type: 2,
                        style: 2,
                        label: 'Приват',
                        custom_id: 'private',
                        emoji: '🚫'
                    },
                    {
                        type: 2,
                        style: 2,
                        label: 'Сховати',
                        custom_id: 'hide',
                        emoji: '🙈'
                    }
                ]
            },{
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Передати',
                        custom_id: 'gift',
                        emoji: '🎁'
                    },
                    {
                        type: 2,
                        style: 1,
                        label: 'Привласнити',
                        custom_id: 'claim',
                        emoji: '👑'
                    }
                ]
            },{
                type: 1,
                components: [
                    // StringSelectComponent
                    {
                        type: 3,
                        placeholder: '🌟 Супер кнопки',
                        custom_id: 'select',
                        options: [
                            {
                                label: 'Зберегти',
                                value: 'presetadd',
                                description: 'пресет каналу',
                                emoji: '💾'
                            },
                            {
                                label: 'Завантажити',
                                value: 'presetset',
                                description: 'пресет',
                                emoji: '📂'
                            },
                            {
                                label: 'Скинути',
                                value: 'reset',
                                description: 'канал',
                                emoji: '🔄'
                            },
                            {
                                label: 'Підняти',
                                value: 'push',
                                description: 'канал угору',
                                emoji: '🚀'
                            },
                            {
                                label: 'Очистити',
                                value: 'clean',
                                description: 'всі повідомлення',
                                emoji: '🧹'
                            },
                        ]
                    }
                ]
            }]
        });
    }
    
    if (oldState.channel && oldState.channel.id !== '1218952948294352916' && oldState.channel.parent.id === '1218952592646996069' && oldState.channel.members.size == 0) {
        return oldState.channel.delete();
    }
});
discordClient.on('interactionCreate', async interaction => {
    if (interaction.type == 3) { //button / filed
        if (interaction.customId === 'edit') {
            await interaction.showModal({
                title: 'Назвати канал',
                custom_id: 'edit',
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                custom_id: 'name',
                                label: 'Назва каналу',
                                placeholder: `Приватний канал для ${interaction.user.tag}`,
                                value: interaction.channel.name,
                                style: 1,
                                required: false
                            },
                        ]
                    }
                ]
            });
        }
    }
    if (interaction.type == 5) { //modal
        if (interaction.customId === 'edit') {
            console.log(interaction.components[0].components[0].value)
            interaction.channel.setName(interaction.components[0].components[0].value);
        }
        interaction.reply({ embeds: [{ title: '✏️ Канал змінено успішно!', fields: [{ name: 'Назва каналу', value: `\`${interaction.channel.name}\` ≫ \`${interaction.components[0].components[0].value}\``
    }], color: 0x00ff00}], ephemeral: true });
    }
});

