const { EmbedBuilder } = require('discord.js');
const { logChannelID } = require('../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Bot mesajlarını loglama
        if (message.author.bot) return;

        // Log kanalını al
        const logChannel = message.guild.channels.cache.get(logChannelID);
        if (!logChannel) {
            console.log("❌ Log kanalı bulunamadı!");
            return;
        }

        // Log embed mesajı
        const logEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('📩 Yeni Mesaj Gönderildi')
            .setDescription(`**Gönderen:** <@${message.author.id}> (\`${message.author.tag}\`)\n**Kanal:** <#${message.channel.id}>\n\n**Mesaj:**\n${message.content}`)
            .setTimestamp();

        // Log kanalına mesajı gönder
        await logChannel.send({ embeds: [logEmbed] });
        console.log("✅ Mesaj log kanalına atıldı!");
    }
};
