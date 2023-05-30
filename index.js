const Discord = require('discord.js')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const { token, self } = require('./config.json')
const https = require('https');
const ids = require('./discord-ids.json');

//Events import
//const { handle } = require('./events/checkNSFW')

client.on("ready", function(){
    console.log(`AutoManager is ready!`);
});

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    //True if this url is a png image.
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1;
}

function isAllowedFormat(url) {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg|mov|mp4|avi)$/.test(url);
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

    //Post memes to announcement channels
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
                        messagetopub = await channel.send({ files: [{attachment: buffer, name: `AutoMemes.${url.split('.').at(-1)}`}]});
                        await messagetopub.crosspost();
                        console.log(`Posted meme`)
                    });
                });
                break
            }
        }
    }
})

//Memes Scraping Begin (warning: this uses a selfbot account, which is against Discord ToS)
const Discord2 = require('discord.js-selfbot-v13');
const selfbot = new Discord2.Client({
    checkUpdate:false
});

selfbot.on('ready', async () => {
  console.log(`Self account - memes scraping - is ready!`);
})

selfbot.on('messageCreate', async (msg) => {
    if(msg.channel.id === ids.thirdpartymemes){
        var channel = selfbot.channels.cache.get(ids.scraped)

        if (msg.attachments.size > 0) {
            var url = msg.attachments.first()?.url

            if(!isAllowedFormat(url)){
                return;
            }

            return channel.send({content:`${url}`})
        } else if(isValidUrl(msg.content)){
            var url = msg.content

            if(!isAllowedFormat(url)){
                return;
            }

            return channel.send({content:`${url}`})
        }
    }
})

client.on('messageCreate', async (message) => {
    if(message.author.id === client.user.id) return;
    if(message.channel.id === ids.scraped){
        var channel = client.channels.cache.get(ids.posts)
        var embed = new Discord2.MessageEmbed()
        .addFields(
            {name: `url`, value:`${message.content || "null"}`},
            {name: `uploader`, value:`1009473107335061544`},
            {name: `uploader_name`, value:`AutoMemes`},
            {name: `caption`, value:`No Caption`},
            {name: `yes_votes`, value:`Placeholder`},
            {name: `no_votes`, value:`Placeholder`}
        )
        channel.send({embeds:[embed]})
    }
})


client.login(token)
selfbot.login(self);