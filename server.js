const configureDiscordBot = require('./discordBot');
const startWebServer = require('./webServer');
require('dotenv').config()

const TOKEN = process.env.TOKEN

const discordClient = configureDiscordBot(TOKEN);
discordClient.login(TOKEN).then(() => { console.log('Discord бот запущен'); });
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
        channel.send({
            content: `<@${user.id}>`,
            embeds: [
                {
                    color: 0x0099ff,
                    title: `Вітаємо ${user.tag}!`,
                    description: 'Налаштуйте свій канал так, як вам подобається.',
                    fields: [
                        {
                            name: '• Власник каналу',
                            value: `<@${user.id}>`,
                        },
                        {
                            name: '• Назва каналу',
                            value: `Приватний канал для ${user.tag}`,
                        },
                        {
                            name: '• Ліміт',
                            value: '...',
                            inline: true
                        },
                        {
                            name: '• Регіон',
                            value: '...',
                            inline: true
                        },
                        {
                            name: '• Доступ',
                            value: '...',
                            inline: true
                        }
                    ]
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
                }, {
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
                }, {
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
                }, {
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
                                required: false,
                                max_length: 100,
                                min_length: 1,
                            }
                        ]
                    }, {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                custom_id: 'limit',
                                label: 'limit',
                                placeholder: `0 - 99`,
                                value: interaction.channel.userLimit,
                                style: 1,
                                required: false,
                                max_length: 2,
                                min_length: 1,
                            },
                        ]
                    }
                ]
            });
        }
        if (interaction.customId === 'access') {
            await interaction.reply({
                embeds: [
                    {
                        title: '👥 Керуйте доступом користувачів та ролей до Вашого динамічного каналу',
                        color: 0x0099ff,
                        fields: [
                            {
                                name: 'Дозволений список:',
                                value: `${(await getChannelAllowList(interaction.channel)).toString()}`,
                            },
                            {
                                name: 'Список заборонених:',
                                value: `${(await getChannelDenyList(interaction.channel)).toString()}`,
                            }
                        ]

                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-add',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👆 ...',
                            }
                        ]
                    }, {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-ban',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👊 ...',
                            }
                        ]
                    }, {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-unban',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👇 ...',
                            }
                        ]
                    }
                ],
                ephemeral: true
            });
        }
        if (interaction.customId === 'kick') {
            await interaction.reply({
                embeds: [
                    {
                        title: '👟 Кікайте учасника зі свого каналу',
                        description: 'Кого б ви хотіли вигнати зі свого каналу?',
                        color: 0xff0000
                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 5,
                                custom_id: 'just-kick',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '...',
                            }
                        ]
                    }
                ],
                ephemeral: true
            });
        };
        if (interaction.customId === 'public') {
            // make magic change
            // make magic color
            // make magic deactivation
            showChannel(interaction.channel);
            interaction.reply({
                embeds: [
                    {
                        title: '🌐 Тепер ваш канал є загальнодоступним!',
                        fields: [
                            {
                                name: 'Список заборонених:',
                                value: '...',
                            }
                        ],
                        footer: {
                            text: 'Хто не повинен мати доступу до каналу?',
                        },
                        color: 0x0099ff
                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-ban',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👊 ...',
                            }
                        ]
                    }, {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-unban',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👇 ...',
                            }
                        ]
                    }
                ],
                ephemeral: true
            })

        }
        if (interaction.customId === 'private') {
            // make magic change
            // make magic color
            // make magic deactivation
            interaction.reply({
                embeds: [
                    {
                        title: '🚫 Тепер ваш канал є приватним!',
                        fields: [
                            {
                                name: 'Список заборонених:',
                                value: '...',
                            }
                        ],
                        footer: {
                            text: 'Хто повинен мати доступу до каналу?',
                        },
                        color: 0xff0000
                    }
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-add',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👆 ...',
                            }
                        ]
                    }, {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'access-unban',
                                min_values: 1,
                                max_values: 25,
                                placeholder: '👇 ...',
                            }
                        ]
                    }
                ], ephemeral: true
            })
        };
        if (interaction.customId === 'hide') {
            // make magic change
            // make magic color
            // make magic deactivation
            hideChannel(interaction.channel)
            interaction.reply({
                embeds: [
                    {
                        title: '🙈 Ваш канал тепер прихований!',
                        color: 0xff9900,
                        fields: [
                            {
                                name: 'Дозволений список:',
                                value: '...',
                            }
                        ],
                        footer: {
                            text: 'Ваш канал тепер невидимий.\nХто повинен мати доступ до вашого каналу?',
                        }
                    }
                ],
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 7,
                            custom_id: 'access-add',
                            min_values: 1,
                            max_values: 25,
                            placeholder: '👆 ...',
                        }
                    ]
                }, {
                    type: 1,
                    components: [
                        {
                            type: 7,
                            custom_id: 'access-unban',
                            min_values: 1,
                            max_values: 25,
                            placeholder: '👇 ...',
                        }
                    ]
                }],
                ephemeral: true
            })
        };
        if (interaction.customId === 'gift') {
            // make magic change
            // make magic color
            interaction.reply({
                embeds: [
                    {
                        title: '🎁 Передача каналу',
                        color: 0x00ff00,
                    }
                ],
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 5,
                            custom_id: 'chose-gift',
                            min_values: 1,
                            max_values: 1,
                            placeholder: '🎁 ...',
                        }
                    ]
                }],
                ephemeral: true
            })
        };
        if (interaction.customId === 'claim') {
            // make magic change
            // make magic color
            interaction.reply({
                embeds: [
                    {
                        title: '👑 Привласнити канал?',
                        color: 0x00ff00,
                    }
                ],
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 3,
                            custom_id: 'just-claim',
                            label: 'Підтвердити',
                        },
                        {
                            type: 2,
                            style: 4,
                            custom_id: 'cancel',
                            label: 'Скасувати',
                        }
                    ]
                }],
                ephemeral: true
            })
        }
    }
    if (interaction.type == 5) { // modal
        if (interaction.customId === 'edit') {
            console.log(interaction.components)
            const oldName = interaction.channel.name;
            const oldLimit = interaction.channel.userLimit;
            let newName, newLimit;

            if (interaction.components[0].components[0].value == '') {
                newName = `Приватний канал для ${interaction.user.tag}`;
            } else {
                newName = interaction.components[0].components[0].value;
            }

            if (interaction.components[1].components[0].value == '' || !parseInt(interaction.components[1].components[0].value)) {
                newLimit = oldLimit;
            } else {
                newLimit = interaction.components[1].components[0].value;
            }

            interaction.channel.setName(newName);
            interaction.channel.setUserLimit(interaction.components[1].components[0].value);

            interaction.reply({
                embeds: [{
                    title: '✏️ Канал змінено успішно!', fields: [
                        { name: 'Назва каналу', value: `\`${oldName}\` ≫ \`${newName}\`` },
                        { name: 'Ліміт каналу', value: `\`${oldLimit}\` ≫ \`${newLimit}\`` },
                    ], color: 0x00ff00
                }], ephemeral: true
            });
        }
    }
});


async function getChannelAllowList(channel) {
    // Fetch permission overwrites for the channel
    const permissionOverwrites = await channel.permissionOverwrites.cache;
    const list = []
    permissionOverwrites.forEach(permissionOverwrite => {
        if (permissionOverwrite.allow.toArray().includes('Connect')) {
            if (permissionOverwrite.type === 0) {
                list.push(`<@&${permissionOverwrite.id}>`)
            }
            if (permissionOverwrite.type === 1) {
                list.push(`<@${permissionOverwrite.id}>`)
            }
        }
    });
    return list
}

async function getChannelDenyList(channel) {
    // Fetch permission overwrites for the channel
    const permissionOverwrites = await channel.permissionOverwrites.cache;
    const list = []
    permissionOverwrites.forEach(permissionOverwrite => {
        console.log(permissionOverwrite)
        console.log(permissionOverwrite.deny.toArray())
        if (permissionOverwrite.deny.toArray().includes('Connect')) {
            if (permissionOverwrite.type === 0) {
                list.push(`<@&${permissionOverwrite.id}>`)
            }
            if (permissionOverwrite.type === 1) {
                list.push(`<@${permissionOverwrite.id}>`)
            }
        }
    });
    return list
}

async function hideChannel(channel) {
    // Set permission to everyone to not see the channel
    const everyone = await channel.guild.roles.everyone;
    await channel.permissionOverwrites.create(everyone, {
        ViewChannel: false
    })
    console.log('Hided channel ' + channel.name)
}

async function showChannel(channel) {
    // Set permission to everyone to see the channel
    const everyone = await channel.guild.roles.everyone;
    await channel.permissionOverwrites.create(everyone, {
        ViewChannel: true
    })
    console.log('Showed channel ' + channel.name)
}