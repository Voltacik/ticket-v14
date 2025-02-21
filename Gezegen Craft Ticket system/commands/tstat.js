const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
const ClosedTicket = require('../schemas/closedTicket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tstat')
        .setDescription('Yetkilinin ilgilendiği ticket sayısını ve detaylarını gösterir.')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('İstatistiklerini görmek istediğin yetkili')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('kullanıcı');
        const tickets = await ClosedTicket.find({ claimedBy: user.id });

        if (tickets.length === 0) {
            return interaction.reply({ content: `📊 **${user.username}** hiç ticket ile ilgilenmemiş.`, ephemeral: true });
        }

        let table = `📊 **${user.username} - Ticket İstatistikleri**\n\n`;
        table += codeBlock('yaml', `Toplam Ticket: ${tickets.length}`);
        table += "```yaml\n"; // Markdown formatında başlatıyoruz

        table += `#  | Çözüm Durumu | Kapatma Nedeni\n`;
        table += `------------------------------------------\n`;

        tickets.slice(0, 10).forEach((ticket, index) => {
            let solvedStatus = ticket.solved.toLowerCase() === "evet" ? "✅" : "❌";
            table += `${String(index + 1).padEnd(3)}| ${solvedStatus.padEnd(13)}| ${ticket.closeReason.slice(0, 25)}\n`;
        });

        table += "```"; // Markdown formatını kapatıyoruz

        await interaction.reply({ content: table, ephemeral: true });
    }
};
