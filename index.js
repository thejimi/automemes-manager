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

const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
return !!urlPattern.test(urlString);
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
                try {
                    if(scan.isNsfw === true){
                        const embed = new Discord.MessageEmbed()
                        .setColor("GREEN")
                        .setDescription(`[Your meme's URL - it might get removed by Discord soon!](${message.attachments.first()?.url})`)
    
                        var author = await client.users.fetch(message.embeds[0].author.url.replace('https://discord.com/users/', ''))

                        author.send({embeds:[embed], content:`> The meme that you submitted has been classified as \`${scan.tag}\` with probability \`${scan.probability}\`\n \n**Are we wrong?** Our machines are new and the AI is still learning, please ask a moderator to upload the meme for you.`})
                        return message.delete()
                    }
                } catch (err) {
                    //do nothing
                    //its kinda stupid i put it here but it will break then
                    console.log("nvm")
                }
            }
        }
    }
})

client.login(token)