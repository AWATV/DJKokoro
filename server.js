const configureDiscordBot = require('./discordBot');
const startWebServer = require('./webServer');
const yaml = require('yaml');
const fs = require('fs');
require('dotenv').config()

const TOKEN ='MTIxMTMzOTIxMzg3NDY2MzQ4OQ.GuFbjC.WjGS9l8kuLn5GkhbVB9mfaXGKGl1tWJn7t7M88'
const messages = yaml.parse(fs.readFileSync('messages.yml', 'utf8'));

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
            name: messages.baseChannelName.replace('{userTag}', user.tag)
        })
        member.voice.setChannel(channel);
        channel.send(await makeBaseMessage(messages.colorPrimary, user, channel));
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
                                name: messages.accessList,
                                value: `${(await getChannelAllowList(interaction.channel)).toString()}`,
                            },
                            {
                                name: messages.denyList,
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
                newName = messages.baseChannelName.replace('{userTag}', interaction.user.tag);
            } else {
                newName = interaction.components[0].components[0].value;
            }

            if (interaction.components[1].components[0].value == '' || !parseInt(interaction.components[1].components[0].value)) {
                newLimit = oldLimit;
            } else {
                newLimit = interaction.components[1].components[0].value;
            }

            interaction.channel.setName(newName);
            interaction.channel.setUserLimit(newLimit);

            interaction.reply({
                embeds: [{
                    title: messages.notificationEditSuccess, fields: [
                        { name: messages.name, value: `\`${oldName}\` ≫ \`${newName}\`` },
                        { name: messages.limit, value: `\`${oldLimit}\` ≫ \`${newLimit}\`` },
                    ], color: messages.colorSuccess
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

async function makeBaseMessage(color, user, channel) {
    console.log(channel.rtcRegion)
    return {
        content: `<@${user.id}>`,
        embeds: [
            {
                color: color,
                title: messages.baseMessageWelcome.replace('{userTag}', user.tag),
                description: messages.baseMessageDescription,
                footer: {
                    text: 'В розробці!',
                },
                fields: [
                    {
                        name: messages.owner,
                        value: `<@${user.id}>`,
                    },
                    {
                        name: messages.name,
                        value: channel.name,
                    },
                    {
                        name: messages.limit,
                        value: channel.userLimit,
                        inline: true
                    },
                    {
                        name: messages.region,
                        value: '...',
                        inline: true
                    },
                    {
                        name: messages.access,
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
                        label: messages.btnEdit,
                        custom_id: 'edit',
                        emoji: messages.btnEditEmoji
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnAccess,
                        custom_id: 'access',
                        emoji: messages.btnAccessEmoji,
                        disabled : true
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnKick,
                        custom_id: 'kick',
                        emoji: messages.btnKickEmoji,
                        disabled : true
                    }
                ]
            }, {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnPublic,
                        custom_id: 'public',
                        emoji: messages.btnPublicEmoji,
                        disabled : true
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnPrivate,
                        custom_id: 'private',
                        emoji: messages.btnPrivateEmoji,
                        disabled : true
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnHide,
                        custom_id: 'hide',
                        emoji: messages.btnHideEmoji,
                        disabled : true
                    }
                ]
            }, {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: messages.btnGift,
                        custom_id: 'gift',
                        emoji: messages.btnGiftEmoji,
                        disabled : true
                    },
                    {
                        type: 2,
                        style: 1,
                        label: messages.btnClaim,
                        custom_id: 'claim',
                        emoji: messages.btnClaimEmoji,
                        disabled : true
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
                        disabled : true,
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
                ],
            }]
    }
}