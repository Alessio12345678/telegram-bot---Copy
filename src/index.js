const TelegramBot = require('node-telegram-bot-api')
require('dotenv').config()
const commands = require('./commandsList.js')
const fs = require('fs')
const TOKEN = process.env.TOKEN
const path = require('path');
const bot = new TelegramBot(TOKEN, { polling: true })
const stickers = require('./stickers.js')

const telegramChannel = '@StellarCats_Meow'//-1001437370667

const WEBHOOK_URL = `https://981b-79-37-130-129.ngrok-free.app/telegram-webhook`
bot.setWebHook(WEBHOOK_URL);
const isUserSubscribedToChannel = async (userId) => {
    return await bot.getChatMember(telegramChannel, userId)
        .then((chatMember) => {
            return chatMember.status === 'member' || chatMember.status === 'administrator'
        })
        .catch((error) => {
            console.error('Errore durante la verifica dell\'iscrizione al canale:', error.message)
            return false;
        })
}


const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'))
const commandsList = {}

commandFiles.forEach(file => {
    const command = require(`./commands/${file}`)
    commandsList[command.name] = command
})



for (const key in commandsList) {
    const command = commandsList[key]
    bot.onText(new RegExp(`\\/${command.name}`), (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        isUserSubscribedToChannel(userId)
            .then((isSubscribed) => {
                if (isSubscribed){ 
                    command.execute(bot, msg) 
                    bot.deleteMessage(chatId, msg.message_id)
                }
                else {
                    bot.sendMessage(chatId, `In order to use this bot, join our channel ${telegramChannel}.`)
                    bot.sendSticker(chatId, stickers['sad'].fileId) 
                }
            })
    })
}




bot.setMyCommands(commands)




