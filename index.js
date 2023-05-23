const Discord = require('discord.js')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const { token } = require('./config.json')

client.on("ready", function(){
    console.log(`the client becomes ready to start`);
});

client.on('messageCreate', async (message) => {

})

client.login(token)