const configureDiscordBot = require('./discordBot');
const startWebServer = require('./webServer');
const yaml = require('yaml');
const fs = require('fs');
require('dotenv').config()

const TOKEN = process.env.TOKEN
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

    if (newState.channel && newState.channel.id === process.env.CHANNEL_ID) {
        const channel = await newState.guild.channels.create({
            type: 2,
            parent: newState.channel.parent,
            name: messages.baseChannelName.replace('{userTag}', user.tag)
        })
        member.voice.setChannel(channel);
        baseMessage = await channel.send(await makeBaseMessage(messages.colorPrimary, user, channel, true, 1));
        await baseMessage.edit(await makeBaseMessage(messages.colorPrimary, user, channel, false, 1));
    }

    if (oldState.channel && oldState.channel.id !== process.env.CHANNEL_ID && oldState.channel.parent.id === process.env.CATEGORY_ID && oldState.channel.members.size == 0) {
        return oldState.channel.delete();
    }
});
discordClient.on('interactionCreate', async interaction => {
    if (interaction.type == 3) { //button / filed
        if (interaction.customId === 'edit') {
            if (await checkOwner(interaction)) {
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
        }
        if (interaction.customId === 'access') {
            if (await checkOwner(interaction)) {
                await interaction.reply(await makeAccessMessage(interaction.channel, true));
            }
        }
        if (interaction.customId === 'kick') {
            await interaction.reply({
                embeds: [
                    {
                        title: messages.kickMessage,
                        description: messages.kickMessageDescription,
                        color: messages.colorInfo
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
                                placeholder: messages.btnKickKick,
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
                        title: messages.publicMessage,
                        fields: [
                            {
                                name: messages.denyList,
                                value: getChannelDenyList(interaction.channel),
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
                                custom_id: 'public-ban',
                                min_values: 1,
                                max_values: 25,
                                placeholder: messages.btnAccessBan,
                            }
                        ]
                    }, {
                        type: 1,
                        components: [
                            {
                                type: 7,
                                custom_id: 'public-reset',
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
                                custom_id: 'access-reset',
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
                            custom_id: 'access-reset',
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
        if (interaction.customId === 'access-add') {
            // Arrays to store promises for users and roles permissions
            const userPromises = [];
            const rolePromises = [];
        
            // Handling permissions for users
            interaction.users.forEach(user => {
                userPromises.push(
                    interaction.channel.permissionOverwrites.create(user, {
                        ViewChannel: true,
                        Connect: true
                    })
                );
            });
        
            // Handling permissions for roles
            interaction.roles.forEach(role => {
                rolePromises.push(
                    interaction.channel.permissionOverwrites.create(role, {
                        ViewChannel: true,
                        Connect: true
                    })
                );
            });
        
            // Waiting for all permissions to be set
            Promise.all([...userPromises, ...rolePromises])
                .then(async () => {
                    // After all permissions are set, update the interaction
                    await interaction.update(await makeAccessMessage(interaction.channel, true));
                })
                .catch(error => {
                    // Handle errors if any
                    console.error('Error occurred:', error);
                });
        }
        if (interaction.customId === 'access-ban') {
            // Arrays to store promises for users and roles permissions
            const userPromises = [];
            const rolePromises = [];
        
            // Handling permissions for users
            interaction.users.forEach(user => {
                userPromises.push(
                    interaction.channel.permissionOverwrites.create(user, {
                        ViewChannel: false,
                        Connect: false
                    })
                );
            });
        
            // Handling permissions for roles
            interaction.roles.forEach(role => {
                rolePromises.push(
                    interaction.channel.permissionOverwrites.create(role, {
                        ViewChannel: false,
                        Connect: false
                    })
                );
            });
        
            // Waiting for all permissions to be set
            Promise.all([...userPromises, ...rolePromises])
                .then(async () => {
                    // After all permissions are set, update the interaction
                    await interaction.update(await makeAccessMessage(interaction.channel, true));
                })
                .catch(error => {
                    // Handle errors if any
                    console.error('Error occurred:', error);
                });
        }
        if (interaction.customId === 'access-reset') {
            // Arrays to store promises for users and roles permissions
            const userPromises = [];
            const rolePromises = [];
        
            // Handling permissions for users
            interaction.users.forEach(user => {
                userPromises.push(
                    interaction.channel.permissionOverwrites.delete(user, {})
                );
            });
        
            // Handling permissions for roles
            interaction.roles.forEach(role => {
                rolePromises.push(
                    interaction.channel.permissionOverwrites.create(role, {})
                );
            });
        
            // Waiting for all permissions to be set
            Promise.all([...userPromises, ...rolePromises])
                .then(async () => {
                    // After all permissions are set, update the interaction
                    await interaction.update(await makeAccessMessage(interaction.channel, true));
                })
                .catch(error => {
                    // Handle errors if any
                    console.error('Error occurred:', error);
                });
        }
        if (interaction.customId === 'just-kick') {
            interaction.users.forEach(user => {
                const member = interaction.guild.members.cache.get(user.id);
                if (member.voice && member.voice.channel && member.voice.channel.id == interaction.channel.id) {
                    member.voice.disconnect();
                }
            })
        }
    }
    if (interaction.type == 5) { // modal
        if (interaction.customId === 'edit') {
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

            await interaction.channel.setName(newName);
            await interaction.channel.setUserLimit(newLimit);

            interaction.reply({
                embeds: [{
                    title: messages.notificationEditSuccess, fields: [
                        { name: messages.name, value: `\`${oldName}\` ≫ \`${newName}\`` },
                        { name: messages.limit, value: `\`${oldLimit}\` ≫ \`${newLimit}\`` },
                    ], color: messages.colorSuccess
                }], ephemeral: true
            });
            let num
            interaction.message.components[1].components.forEach(component => {
                if (component.disabled) {
                    if (component.data.custom_id == 'public') {
                        num = 1
                    }
                    if (component.data.custom_id == 'private') {
                        num = 2
                    }
                    if (component.data.custom_id == 'hide') {
                        num = 3
                    }
                }
            })
            interaction.message.edit(await makeBaseMessage(interaction.message.embeds[0].color, interaction.user, interaction.channel, false, num));
        }
    }
});


async function getChannelAllowList(channel) {
    return updateChannel(channel)
    .then(channelPromise => {
        const permissionOverwrites = channelPromise.permissionOverwrites.cache;
        const list = [];
        permissionOverwrites.forEach(permissionOverwrite => {
            if (permissionOverwrite.allow.toArray().includes('Connect') && permissionOverwrite.allow.toArray().includes('ViewChannel')) {
                if (permissionOverwrite.type === 0) {
                    list.push(`<@&${permissionOverwrite.id}>`);
                }
                if (permissionOverwrite.type === 1) {
                    list.push(`<@${permissionOverwrite.id}>`);
                }
            }
        });
        let text;
        if (list.length === 0) {
            text = messages.emptyList;
        } else {
            text = list.toString();
        }
        return text;
    });
}

async function getChannelDenyList(channel) {
    return updateChannel(channel)
    .then(channelPromise => {
        const permissionOverwrites = channelPromise.permissionOverwrites.cache;
        const list = [];
        permissionOverwrites.forEach(permissionOverwrite => {
            if (permissionOverwrite.deny.toArray().includes('Connect') && permissionOverwrite.deny.toArray().includes('ViewChannel')) {
                if (permissionOverwrite.type === 0) {
                    list.push(`<@&${permissionOverwrite.id}>`);
                }
                if (permissionOverwrite.type === 1) {
                    list.push(`<@${permissionOverwrite.id}>`);
                }
            }
        });
        let text;
        if (list.length === 0) {
            text = messages.emptyList;
        } else {
            text = list.toString();
        }
        return text;
    });
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

async function makeBaseMessage(color, user, channel, ping, btn) {
    let content, pb, pr, hd;
    if (ping) {
        content = `<@${user.id}>`
    } else {
        content = ''
    }
    if (btn == 1) {
        pb = true;
        pr = false;
        hd = false;
    }
    if (btn == 2) {
        pb = false;
        pr = true;
        hd = false;
    }
    if (btn == 3) {
        pb = false;
        pr = false;
        hd = true;
    }
    return {
        content: content,
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
                        emoji: messages.btnAccessEmoji
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnKick,
                        custom_id: 'kick',
                        emoji: messages.btnKickEmoji
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
                        disabled : pb
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnPrivate,
                        custom_id: 'private',
                        emoji: messages.btnPrivateEmoji,
                        disabled : pr
                    },
                    {
                        type: 2,
                        style: 2,
                        label: messages.btnHide,
                        custom_id: 'hide',
                        emoji: messages.btnHideEmoji,
                        disabled : hd
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

async function makeAccessMessage(channel, menu) {
    let components
    if (menu) {
        components = [
            {
                type: 1,
                components: [
                    {
                        type: 7,
                        custom_id: 'access-add',
                        min_values: 1,
                        max_values: 25,
                        placeholder: messages.btnAccessAdd,
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
                        placeholder: messages.btnAccessBan,
                    }
                ]
            }, {
                type: 1,
                components: [
                    {
                        type: 7,
                        custom_id: 'access-reset',
                        min_values: 1,
                        max_values: 25,
                        placeholder: messages.btnAccessReset,
                    }
                ]
            }
        ]
    } else {
        components = []
    }
    return {
        embeds: [
            {
                title: messages.accessMessage,
                color: 0x0099ff,
                fields: [
                    {
                        name: messages.accessList,
                        value: `${await getChannelAllowList(channel)}`,
                    },
                    {
                        name: messages.denyList,
                        value: `${await getChannelDenyList(channel)}`,
                    }
                ]

            }
        ],
        components: components,
        ephemeral: true,
        fetchReply: true
    }
}
async function checkOwner(interaction) {
    ownerId = interaction.message.embeds[0].fields[0].value.replace('<@', '').replace('>', '')
    if (ownerId !== interaction.user.id) {
        await interaction.reply({ embeds: [{ color: messages.colorWarning, title: messages.errorNotOwner, description: messages.errorNotOwnerDescription.replace('{creatingChannel}', `<#${process.env.CHANNEL_ID}>`) }], ephemeral: true })
        return false
    } else {
        return true
    }
}

async function updateChannel(channel) {
    return channel.guild.channels.fetch(channel.id)
}