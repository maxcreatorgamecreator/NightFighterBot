const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('find')
        .setDescription('Find open empty Roblox groups with 0 members!')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
    );
    console.log('Commands registered!');
}

async function findEmptyGroups() {
    const emptyGroups = [];
    
    for (let i = 0; i < 50; i++) {
        const randomId = Math.floor(Math.random() * 10000000) + 1;
        try {
            const response = await axios.get(
                `https://groups.roblox.com/v1/groups/${randomId}`
            );
            const group = response.data;
            
            if (group.memberCount === 0 && !group.isLocked && group.publicEntryAllowed) {
                emptyGroups.push({
                    name: group.name,
                    id: group.id,
                    link: `https://www.roblox.com/groups/${group.id}`
                });
            }
            
            if (emptyGroups.length >= 5) break;
            
        } catch (err) {}
        
        await new Promise(r => setTimeout(r, 300));
    }
    
    return emptyGroups;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'find') {
        await interaction.deferReply();
        const groups = await findEmptyGroups();
        if (groups.length === 0) {
            await interaction.editReply('❌ No open empty groups found! Try again!');
            return;
        }
        let message = '🔍 **Open Empty Roblox Groups Found!**\n\n';
        groups.forEach((group, index) => {
            message += `**${index + 1}. ${group.name}**\n`;
            message += `🔗 ${group.link}\n\n`;
        });
        message += '✅ Join and claim before someone else does!';
        await interaction.editReply(message);
    }
});

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}!`);
    registerCommands();
});

client.login(TOKEN);
