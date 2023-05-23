const axios = require('axios')
const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')

class DestroyPornError {
    name = 'DestroyPorn_Error';
    constructor(message){
        this.message = message;
    }
}

async function getPredictions(imageURL) {
    const model = await nsfw.load()

    let pic = await axios.get(`${imageURL}`, {
        responseType: 'arraybuffer',
    })
      
    let image = tf.node.decodeImage(pic.data,3)
    let predictions = await model.classify(image)
    image.dispose()
    
    return predictions
}

async function classify(imageURL, sendMoreInfo) {
    if(sendMoreInfo === true){
        let predictions = await getPredictions(imageURL)
        if(predictions[0].className === 'Neutral'){
            let returnit = {
                ClassifiedAs:"Normal",
                WinnerTag:predictions[0].className,
                Probability:predictions[0].probability,
                AllOptions:[
                    predictions
                ]
            }

            return returnit;
        } else {
            let returnit = {
                ClassifiedAs:"NSFW",
                WinnerTag:predictions[0].className,
                Probability:predictions[0].probability,
                AllOptions:[
                    predictions
                ]
            }

            return returnit;
        }
    } else if(sendMoreInfo === false){
        let predictions = await getPredictions(imageURL)

        if(predictions[0].className === 'Neutral'){
            return false
        } else {
            return true;
        }

        //true = there is nsfw;
        //false = its not nsfw;
    } else {
        throw new DestroyPornError(`'${sendMoreInfo}' is not a valid sendMoreInfo option. Expected true or false.`)
    }
}

async function example(){
    let nsfw_image_example = 'https://cdn.discordapp.com/attachments/1110565852622889112/1110591785920643092/56a3648e-accd-4a78-9482-a3c9d29b36d7-profile_image-300x300.png' //example porn image
    let results = await classify(nsfw_image_example, true)
    
    if(results.ClassifiedAs === 'NSFW'){
        return console.log(`This image has been classified as NSFW, the probability of it being a ${results.WinnerTag} image is ${results.Probability}.`)
    } else {
        return console.log("Yay, this image is not nsfw!")
    }
}

example()