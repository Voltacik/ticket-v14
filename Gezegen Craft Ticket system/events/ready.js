module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`${client.user.tag} olarak giriş yapıldı!`);

        client.user.setPresence({
            activities: [{ name: 'Destek Almak İçin Tıkla!', type: 0, url: 'https://discord.gg/gezginnw' }],
            status: 'online'
        });
    }
};
