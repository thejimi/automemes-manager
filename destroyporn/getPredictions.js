const axios = require('axios')
const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')

const model = await nsfw.load()

export default async function (imageURL) {
    let pic = await axios.get(`${imageURL}`, {
        responseType: 'arraybuffer',
    })
      
    let image = tf.node.decodeImage(pic.data,3)
    let predictions = await model.classify(image)
    image.dispose()
    
    return predictions
}

