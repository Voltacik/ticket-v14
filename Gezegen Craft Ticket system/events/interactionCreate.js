const { 
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, 
    EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const Ticket = require('../schemas/ticket'); 
const ClosedTicket = require('../schemas/closedTicket'); 
const { categoryID, ticketRoleID, logChannelID, closedLogChannelID, claimLogChannelID } = require('../config.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isCommand()) {
            console.log(`📝 Slash Komutu Kullanıldı: ${interaction.commandName}`);
            const command = interaction.client.commands.get(interaction.commandName);
            if (command) await command.execute(interaction);
        } 
        else if (interaction.isButton()) {
            console.log(`🔘 Butona Basıldı: ${interaction.customId}`);

            // **🎫 DESTEK TALEBİ AÇMA**
            if (interaction.customId === 'open_ticket') {
                const modal = new ModalBuilder()
                    .setCustomId('ticket_reason')
                    .setTitle('Destek Talebi');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('ticket_reason_input')
                    .setLabel('Destek Nedeni?')
                    .setStyle(TextInputStyle.Paragraph);

                const row = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }

            // **✅ TİCKET ÜSTLENME**
            else if (interaction.customId.startsWith('claim_ticket_')) {
                const ticketChannel = interaction.channel;
                const ticket = await Ticket.findOne({ channelId: ticketChannel.id });

                if (!ticket) return interaction.reply({ content: '❌ Ticket bulunamadı.', ephemeral: true });

                ticket.claimedBy = interaction.user.id;
                await ticket.save();

                const claimChannel = interaction.guild.channels.cache.get(claimLogChannelID);
                if (claimChannel) {
                    claimChannel.send(`✅ <@${interaction.user.id}> ticket **${ticketChannel.name}** üstlendi!`);
                }

                await interaction.reply({ content: `🎟 Ticket üstlenildi!`, ephemeral: true });
            }

            // **❌ TİCKET KAPATMA (Modal ile)**
            else if (interaction.customId.startsWith('close_ticket_')) {
                const ticketChannel = interaction.channel;
                const ticket = await Ticket.findOne({ channelId: ticketChannel.id });

                if (!ticket) return interaction.reply({ content: '❌ Ticket bulunamadı.', ephemeral: true });

                // **📌 Yetkiliye Sorunun Açıklamasını ve Çözümünü Sor**
                const modal = new ModalBuilder()
                    .setCustomId(`close_ticket_modal_${ticketChannel.id}`)
                    .setTitle('🎫 Ticket Kapatma Bilgileri');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Sorunun Açıklaması')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const statusInput = new TextInputBuilder()
                    .setCustomId('close_status')
                    .setLabel('Sorun çözüldü mü? (Evet/Hayır)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const row1 = new ActionRowBuilder().addComponents(reasonInput);
                const row2 = new ActionRowBuilder().addComponents(statusInput);

                modal.addComponents(row1, row2);
                await interaction.showModal(modal);
            }
        } 
        else if (interaction.isModalSubmit()) {
            console.log(`📜 Modal Gönderildi: ${interaction.customId}`);

            // **🎫 Yeni Ticket Açma İşlemi**
            if (interaction.customId === 'ticket_reason') {
                const reason = interaction.fields.getTextInputValue('ticket_reason_input');
                const ticketName = `ticket-${interaction.user.username}`;

                const ticketChannel = await interaction.guild.channels.create({
                    name: ticketName,
                    parent: categoryID,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        },
                        {
                            id: ticketRoleID,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        }
                    ]
                });

                const ticketData = new Ticket({
                    userId: interaction.user.id,
                    reason,
                    channelId: ticketChannel.id
                });
                await ticketData.save();

                const ticketEmbed = new EmbedBuilder()
                    .setTitle(`🎫 ${ticketName}`)
                    .setDescription(`📌 **Kullanıcı:** <@${interaction.user.id}>
📝 **Sebep:** ${reason}`)
                    .setColor('Blue');

                const ticketRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`claim_ticket_${ticketChannel.id}`)
                            .setLabel('Üstlen')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`close_ticket_${ticketChannel.id}`)
                            .setLabel('Kapat')
                            .setStyle(ButtonStyle.Danger)
                    );

                await ticketChannel.send({ content: `<@&${ticketRoleID}>`, embeds: [ticketEmbed], components: [ticketRow] });

                const logChannel = interaction.guild.channels.cache.get(logChannelID);
                if (logChannel) {
                    logChannel.send(`📩 **Yeni Ticket Açıldı!** Kullanıcı: <@${interaction.user.id}>`);
                }

                await interaction.reply({ content: `✅ **Ticket başarıyla açıldı!** <#${ticketChannel.id}>`, ephemeral: true });
            }

            // **❌ Ticket Kapatma İşlemi**
            else if (interaction.customId.startsWith('close_ticket_modal_')) {
                const ticketChannel = interaction.channel;
                const ticket = await Ticket.findOne({ channelId: ticketChannel.id });

                if (!ticket) return interaction.reply({ content: '❌ Ticket bulunamadı.', ephemeral: true });

                const closeReason = interaction.fields.getTextInputValue('close_reason');
                let solved = interaction.fields.getTextInputValue('close_status').toLowerCase();

                if (solved !== 'evet' && solved !== 'hayır') {
                    return interaction.reply({ content: '❌ Lütfen sadece "Evet" veya "Hayır" yazın.', ephemeral: true });
                }

                solved = solved === 'evet' ? true : false;

                const closedTicket = new ClosedTicket({
                    userId: ticket.userId,
                    channelId: ticket.channelId,
                    claimedBy: ticket.claimedBy,
                    closeReason,
                    solved
                });
                await closedTicket.save();
                await ticket.deleteOne();

                const closedLogChannel = interaction.guild.channels.cache.get(closedLogChannelID);
                if (closedLogChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('📁 Ticket Kapatıldı')
                        .setColor('Red')
                        .setDescription(`🎟 **Ticket:** ${ticketChannel.name}
👤 **Kullanıcı:** <@${ticket.userId}>
🛠 **Yetkili:** <@${interaction.user.id}>
📌 **Kapatma Nedeni:** ${closeReason}
✅ **Çözüldü mü?:** ${solved ? 'Evet' : 'Hayır'}`);

                    closedLogChannel.send({ embeds: [logEmbed] });
                }

                await ticketChannel.delete();
            }
        }
    }
};
