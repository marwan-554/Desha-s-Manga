const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = '1482412414267031614';

if (!TOKEN) {
    process.exit(1);
}

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.once('clientReady', async () => {
    console.log(`✅ تم تسجيل الدخول كـ ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { 
        body: [
            new SlashCommandBuilder().setName('manja').setDescription('عرض متجر المانجا الملكي 🥭'),
            new SlashCommandBuilder()
                .setName('give')
                .setDescription('توزيع مانجا للأعضاء (للإدارة فقط)')
                .addUserOption(option => option.setName('user').setDescription('الشخص الذي ستعطيه المانجا').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('كمية المانجا').setRequired(true)),
            new SlashCommandBuilder()
                .setName('say')
                .setDescription('اجعل البوت يقول رسالة (للإدارة فقط)')
                .addStringOption(option => option.setName('message').setDescription('الرسالة التي سيقولها البوت').setRequired(true))
        ] 
    });
    console.log('🚀 تم تسجيل الأوامر!');
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'manja') {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('buy_0.5').setLabel('نص كيلو (50 جنيه)').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('buy_1').setLabel('كيلو (90 جنيه)').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('buy_2').setLabel('2 كيلو (170 جنيه)').setStyle(ButtonStyle.Success),
                );
                const embed = new EmbedBuilder()
                    .setTitle('🥭 مانجة المعلم ديشا')
                    .setDescription('اختر الكمية التي تريد شراءها:')
                    .setColor(0xFF8C00);
                await interaction.reply({ embeds: [embed], components: [row] });
            }

            if (interaction.commandName === 'say') {
                const allowedUsers = ['1336058185034895490', '1125424066359210054'];
                if (!allowedUsers.includes(interaction.user.id)) {
                    return interaction.reply({ content: '❌ عذراً، هذا الأمر مخصص لأصحاب المتجر فقط!', flags: MessageFlags.Ephemeral });
                }
                const msg = interaction.options.getString('message');
                await interaction.reply({ content: '✅ تم الإرسال!', flags: MessageFlags.Ephemeral });
                await interaction.channel.send(msg);
            }

            if (interaction.commandName === 'give') {
                const allowedUsers = ['1336058185034895490', '1125424066359210054'];
                if (!allowedUsers.includes(interaction.user.id)) {
                    return interaction.reply({ content: '❌ عذراً، هذا الأمر مخصص لأصحاب المتجر فقط!', flags: MessageFlags.Ephemeral });
                }
                const targetUser = interaction.options.getUser('user');
                const amount = interaction.options.getInteger('amount');
                await db.add(`balance_${targetUser.id}`, amount);
                await interaction.reply({ content: `✅ تم إضافة **${amount}** جنيه إلى حساب ${targetUser.username} بنجاح!` });
            }
        }

        if (interaction.isButton()) {
            const prices = { 'buy_0.5': 50, 'buy_1': 90, 'buy_2': 170 };
            const items = { 'buy_0.5': 'نص كيلو مانجا', 'buy_1': 'كيلو مانجا', 'buy_2': '2 كيلو مانجا' };
            const price = prices[interaction.customId];
            let balance = await db.get(`balance_${interaction.user.id}`) || 0;
            if (balance < price) return interaction.reply({ content: `رصيدك لا يكفي! (${balance} جنيه)`, flags: MessageFlags.Ephemeral });
            await db.sub(`balance_${interaction.user.id}`, price);
            await interaction.reply({ content: `تم شراء ${items[interaction.customId]} بنجاح! 🥭`, flags: MessageFlags.Ephemeral });
        }
    } catch (error) {
        if (error.code === 10062) return;
        console.error('خطأ في التفاعل:', error);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.content.toLowerCase().includes('ديشا')) {
        db.add(`balance_${message.author.id}`, 5).then(() => {
            message.react('🥭').catch(() => {});
        });
    }
    if (message.content === 'معايا كام جنيه اجيب مانجا') {
        const balance = await db.get(`balance_${message.author.id}`) || 0;
        message.reply(`رصيدك الحالي هو: ${balance} جنيه مانجا 🥭`);
    }
});

client.on('error', (error) => { console.error('خطأ في العميل:', error); });

client.login(process.env.DISCORD_TOKEN);