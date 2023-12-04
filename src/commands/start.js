const keyboardOptions = require('../options/option.js')

const allowedTexts = [
    'sticker',
    'premium',
    'channel'
]

const allowedTime = [
    '7 days',
    '1 month',
    '3 months',
    '6 months',
    '1 year'
]

const choices = []

const isValidURL = url => {
    const pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})' + // domain name
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$','i'  // fragment locator
    )

    return !! pattern.test(url)
}
//Chiedere dove
//Chiedere per quanto
//Chiedere di fornirci link/canale telegram
//data odierna
//data fine


module.exports = {
    name: 'start',
    execute: function(bot,msg) {
        const chatId = msg.chat.id
        let welcomeId = undefined
        let timeId = undefined
        let nameId = undefined
        let errorId = undefined

        bot.sendMessage(chatId, `Welcome ${msg.from.first_name}!\nTo start, choose an option to sponsor your channel/website or else`, keyboardOptions.initialOption)
            .then((sentMessage) => {
                welcomeId = sentMessage.message_id
            })
            .catch((error) => {
                console.error(error)
            })
        
        bot.on('callback_query', (callbackQuery) => {
            const callbackData = callbackQuery.data
            const chatId = callbackQuery.message.chat.id

            choices.push(callbackData)
            if (welcomeId !== undefined) {
                bot.deleteMessage(chatId, welcomeId).catch((error) => console.error(error))
                welcomeId = undefined
            }
            if (timeId !== undefined) {
                bot.deleteMessage(chatId, timeId).catch((error) => console.error(error))
                timeId = undefined
            }
            
            if (allowedTexts.includes(callbackData))  {
                
                bot.sendMessage(chatId, `How long do you want your ${callbackData} to be sponsored for?`, keyboardOptions.timeOption)
                    .then((sentMessage) => {
                        timeId = sentMessage.message_id
                    })
                    .catch((error) => {
                        console.error(error)
                    })
            }
            if (allowedTime.includes(callbackData)) {
                bot.sendMessage(chatId, `What is the name of your channel/website?`)
                    .then((sentMessage) => {
                        nameId = sentMessage.message_id
                    })
                    .catch((error) => {
                        console.error(error)
                    })
            }
                
            
        })
        bot.on('message', (msg) => {
            const chatId = msg.chat.id
            const msgTxt = msg.text

            if (allowedTexts.includes(msgTxt) || allowedTime.includes(msgTxt)) return

            if (nameId !== undefined) {
                bot.deleteMessage(chatId, nameId).catch((error) => console.error(error))
                nameId = undefined
            }
            if (errorId !== undefined) {
                bot.deleteMessage(chatId, errorId).catch((error) => console.error(error))
                errorId = undefined
            }

            if (isValidURL(msgTxt) || msgTxt[0] === '@') {
                choices.push(msgTxt)
                bot.sendMessage(chatId, `${choices[2]} will be sponsored for ${choices[1]} in ${choices[0]}`)
                nameId = msg.message_id
            } else {
                bot.deleteMessage(chatId, msg.message_id).catch((error) => console.error(error))
                bot.sendMessage(chatId, 'Make sure to type the correct url')
            }
        })
        
    }
}