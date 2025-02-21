const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { token, mongoURI } = require('./config.json');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildIntegrations
    ]
});

client.commands = new Collection();
const commands = [];

// Komutları yükleme
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// Slash komutlarını Discord'a yükleme
const rest = new REST({ version: '10' }).setToken(token);

client.once('ready', async () => {
    try {
        console.log(`${client.user.tag} olarak giriş yapıldı!`);
        
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

        console.log('✅ Slash komutları başarıyla Discord’a yüklendi!');
    } catch (error) {
        console.error('❌ Slash komutlarını yüklerken hata oluştu:', error);
    }
});

// MongoDB bağlantısı
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB bağlantısı başarılı!'))
  .catch(err => console.log('❌ MongoDB bağlantı hatası:', err));

// Eventleri yükleme
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    client.on(event.name, (...args) => event.execute(...args, client));
}

console.log(`🔄 Yüklenen eventler: ${eventFiles.join(', ')}`); // ✅ Eventlerin yüklendiğini kontrol et

client.login(token);
