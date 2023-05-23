const Discord = require('discord.js')
const allIntents = new Discord.Intents(7796);
const client = new Discord.Client({ intents: allIntents });
const { token } = require('./Configuration.json')

client.on("ready", function(){
    console.log(`the client becomes ready to start`);
});

client.on('messageCreate', (message) => {
    console.log("test")
})

client.login(token)