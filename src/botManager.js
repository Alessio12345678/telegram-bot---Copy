const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const stickers = require('./stickers.js')
const keyboardOptions = require('./options/option.js')
const commands = require('./commandsList.js')
const utils =  require('./utils.js')

class BotManager {
    constructor(token, channel, webhookPath, commandsPath) {
        this.bot = new TelegramBot(token, { polling: false })
        this.telegramChannel = channel
        this.webhookPath = webhookPath
        this.commandsPath = commandsPath
        this.buccilli = undefined

        this.setupWebhook()
        this.setupCommands()
        this.setupListeners()
    }

    setupWebhook() {
        const webhookUrl = `https://e6f7-2001-b07-6463-6f86-989c-3a9b-fde9-3cdb.ngrok-free.app${this.webhookPath}${this.bot.token}`
        this.bot.setWebHook(webhookUrl)

        this.app = express()
        this.app.use(bodyParser.json())

        this.app.post(`${this.webhookPath}${this.bot.token}`, (req, res) => {
            this.bot.processUpdate(req.body)
            res.sendStatus(200)
        })

        const port = process.env.PORT || 3000
        this.app.listen(port, () => {
            console.log(`Server is listening on port ${port}`)
        })
    }

    setupCommands() {
        const commandFiles = fs.readdirSync(path.join(__dirname, this.commandsPath)).filter(file => file.endsWith('.js'))
        this.commandsList = {}

        commandFiles.forEach(file => {
            const command = require(`./commands/${file}`)
            this.commandsList[command.name] = command
        })

        this.bot.setMyCommands(commands)
    }

    setupListeners() {
        for (const key in this.commandsList) {
            const command = this.commandsList[key]
            this.bot.onText(new RegExp(`\\/${command.name}`), (msg) => this.handleCommand(msg, command))
        }

        this.bot.on('callback_query', (callbackQuery) => this.handleCallbackQuery(callbackQuery))
        this.bot.on('message', (msg) => this.handleMessage(msg))
    }

    handleCommand(msg, command) {
        const chatId = msg.chat.id
        const userId = msg.from.id

        this.isUserSubscribedToChannel(userId)
            .then((isSubscribed) => {
                if (isSubscribed) {
                    command.execute(this.bot, msg)
                    this.bot.deleteMessage(chatId, msg.message_id)
                } else {
                    this.bot.sendMessage(chatId, `In order to use this bot, join our channel ${this.telegramChannel}.`)
                    this.bot.sendSticker(chatId, stickers['sad'].fileId)
                }
            })
    }

    handleCallbackQuery(callbackQuery) {
        const response = callbackQuery.data
        const msgId = callbackQuery.message.message_id
        const chatId = callbackQuery.message.chat.id
        
        if (response.includes('•')) {
            const timeOptions = {
                chat_id: chatId,
                message_id: msgId,
                text: `How long do you want to be sponsored for?`,
                reply_markup: keyboardOptions.timeOption
                
            }
            
            this.bot.editMessageText(`How long do you want to be sponsored for?`, timeOptions)
                .then((result) => {
                    
                }).catch((error) => console.error(error))
        }
        // times are expressed with a space
        else if (response.includes(' ')) {
            const nameOptions = {
                chat_id: chatId,
                message_id: msgId,
                text: `What is your channel/website name?`
            }
            
            this.bot.editMessageText(`What is your channel/website name?`, nameOptions)
                .then((result) => {
                    this.buccilli = result.message_id
                    
                }).catch((error) => console.error(error))
        }
    }

    handleMessage(msg) {
        const msgText = msg.text
        const chatId = msg.from.id
        const msgId = msg.message_id
        if (msgText[0] === '/') return
        
        if (utils.isValidURL(msgText)) {
            this.bot.deleteMessage(chatId, msgId)
            this.bot.editMessageText(``, {
                chat_id: chatId,
                message_id: this.buccilli
            }).then((result) => {
                
            }).catch((error) => console.error(error))
        } 
        else if (msgText[0] === '@') {

        } else {
            
            this.bot.deleteMessage(chatId, msgId)
            this.bot.editMessageText(`Make sure you type the url or channel correctly`, {
                chat_id: chatId,
                message_id: this.buccilli
            }).then((result) => {
                
            }).catch((error) => console.error(error))
            
        }

    }

    isUserSubscribedToChannel(userId) {
        return this.bot.getChatMember(this.telegramChannel, userId)
            .then((chatMember) => chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator')
            .catch((error) => {
                console.error('Error checking channel subscription:', error.message)
                return false
            })
    }
}

module.exports = BotManager