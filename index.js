const Discord = require('discord.js')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const { token } = require('./config.json')
const ids = require('./discord-ids.json');

//Events import
//const { handle } = require('./events/checkNSFW')

client.on("ready", function(){
    console.log(`hi`);
});

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    //True if this url is a png image.
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1;
}

//Handle NSFW detection once posted in 📜┆vote-on-memes
//Only works for images rn, plan for the future:
//- use a different api that could scan a video/gif. It's possible to do that with our current system, but its too slow and memory consuming.
client.on('messageCreate', async (message) => {
    if(message.author.id === client.user.id) return;
    if(message.channel.id === ids.voteonmemes){
        if (message.attachments.size > 0) {
            if (message.attachments.every(attachIsImage)){
                const Image_CheckNSFW = require('./events/Image_checkNSFW')
                const scan = await Image_CheckNSFW.check(message.attachments.first()?.url)
                console.log(scan)
                if(scan.isNsfw === true){
                    return message.reply({content:`Thats fucking porn - ${scan.tag}`})
                } else {
                    return message.reply({content:`you good - ${scan.probability}`})
                }
            }
        }
    }
})

client.login(token)