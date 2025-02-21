const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Destek talebi açma butonu oluşturur.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Destek Talebi')
            .setDescription('Destek almak için aşağıdaki butona tıklayın.')
            .setImage('https://cdn.discordapp.com/attachments/1336075697411719219/1341704810633625620/Varlk_1.png')
            .setColor('#0099ff');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('🎫 Destek Talebi Aç')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
