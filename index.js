const Discord = require('discord.js')
const { Client, Intents, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const { token } = require('./config.json')
const https = require('https');
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
    if (message.channel.id === ids.posts) {
        const url = message.embeds[0].fields[0].value
        
        for (channel_id of ids.video_channels) {
            const channel = await client.channels.fetch(channel_id)
            const messages = await channel.messages.fetch({ limit: 10 })
            const lastHour = messages.filter(m => m.createdTimestamp > Date.now() - 3600000)
            if (lastHour.size < 10) {
                https.get(url, function(res) {
                    var data = [];
                    res.on('data', function(chunk) {
                        data.push(chunk);
                    }).on('end', async function() {
                        var buffer = Buffer.concat(data);
                        messagetopub = await channel.send({ embeds: [
                            new Discord.MessageEmbed()
                                .setColor("2b2d31")
                                .setAuthor({ name: "AutoMemes", iconURL: "https://cdn.discordapp.com/avatars/1009473107335061544/502ea7f2d245049bbffcd002bd1db626.webp?size=80", url: `https://discord.com/api/oauth2/authorize?client_id=1009473107335061544&permissions=533113203776&scope=applications.commands%20bot` })
                                //.setDescription(`${message.embeds[0].fields[4].value} • Uploaded by [${message.embeds[0].fields[2].value}](https://discord.com/users/${message.embeds[0].fields[1].value})`)
                                //.setDescription(`**${message.embeds[0].fields[4].value}**\n[Download](${message.embeds[0].fields[0].value}) • [AutoMemes](https://discord.com/api/oauth2/authorize?client_id=1009473107335061544&permissions=533113203776&scope=applications.commands%20bot) • [Meme World](https://discord.gg/eC5TUKVtPT)`)
                                .setDescription(`**${message.embeds[0].fields[4].value}**\n[Download/Share](${message.embeds[0].fields[0].value}) • Uploaded by [${message.embeds[0].fields[2].value}](https://discord.com/users/${message.embeds[0].fields[1].value})`)
                        ], files: [{attachment: buffer, name: `AutoMemes.${url.split('.').at(-1)}`}]});
                        await messagetopub.crosspost();
                        console.log(`Posted meme`)
                    });
                });
                break
            }
        }
    }
})

client.login(token)