const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const stickers = require('./stickers.js')
const keyboardOptions = require('./options/option.js')
const commands = require('./commandsList.js')
const utils =  require('./utils.js')
const StateManager = require('./stateManager.js')

class BotManager {
    constructor(token, channel, webhookPath, commandsPath) {
        this.bot = new TelegramBot(token, { polling: false })
        this.telegramChannel = channel
        this.webhookPath = webhookPath
        this.commandsPath = commandsPath
        this.buccilli = undefined
        this.obj = {}
        this.stateManager = new StateManager()
        this.franco = {}

        this.setupWebhook()
        this.setupCommands()
        this.setupListeners()
    }
    setupWebhook() {
        const webhookUrl = `https://4407-79-37-130-129.ngrok-free.app${this.webhookPath}${this.bot.token}`
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
                    //if (this.buccilli != undefined) this.bot.deleteMessage(chatId, this.buccilli)
                    command.execute(this.bot, msg)
                    this.stateManager.setUserName(userId, msg.from.first_name);
                    this.stateManager.setData(msg.from.id);// ajilit -> kai
                    this.stateManager.updateCurrentState('initial')
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
        const userId = callbackQuery.from.id

        if (response === 'it' || response === 'eng') {
            this.bot.sendMessage(chatId, response)
            utils.readJSON('./userPreferences.json')
    .then((userPreferences) => {
        let found = false;

        for (let i = 0; i < userPreferences.length; i++) {
            const userPrefs = userPreferences[i];

            if (userPrefs.hasOwnProperty(userId)) {
                if (userPrefs[userId] !== response) {
                    userPrefs[userId] = response;
                    found = true;
                }
                break;
            }
        }

        if (!found) {
            // Se l'utente non è presente, aggiungi una nuova entry
            userPreferences.push({ [userId]: response });
        }

        // Ora scrivi il JSON con le informazioni aggiornate
        utils.writeJSON(userPreferences, './userPreferences.json');
    })
            
            
            return
        }


        const currentState = this.stateManager.getCurrentState() // ajilit -> kai
        
        this.stateManager.setData(callbackQuery.from.id);// ajilit -> kai
        
        

        this.buccilli = msgId
        if(response === 'sponsor') { 
            this.stateManager.updateCurrentState("sponsor")
        }
        else if (response === 'ourthings') {
            this.stateManager.updateCurrentState("ourthings")
        }

        else if (currentState === 'sponsor') {
            this.obj['userId'] = callbackQuery.from.id
            this.obj['userName'] = callbackQuery.from.username
            this.obj['where'] = response
            this.stateManager.updateCurrentState("time")
            
            
        } else if (currentState === 'time') {
            const date = new Date();
            this.obj['duration'] = response
            this.obj['start_Date'] = date.toISOString().split('T')[0]
            const date2 = new Date(date)
            date2.setDate(date.getDate() + this.convertDays(response))
            this.obj['end_Date'] =  date2.toISOString().split('T')[0]
            this.stateManager.updateCurrentState("name")
        }
        
        
        if (response.split("_")[0] === 'back') {
            this.stateManager.updateCurrentState(response.split("_")[1]) //prende lo state precendete
            
            
        }
       
        const stateMod = this.stateManager.getStateByName(this.stateManager.getCurrentState())
        this.bot.editMessageText(stateMod.msg, {
            chat_id: chatId,
            message_id: msgId,
            reply_markup: stateMod.value
        })
    }

    handleMessage(msg) {
        const msgText = msg.text
        const chatId = msg.from.id
        const msgId = msg.message_id
        if (msgText[0] === '/' && this.stateManager.getCurrentState() != 'name') return
        if (utils.isValidURL(msgText)) {
            this.obj['url'] = msgText
            this.bot.editMessageText(`Fatto`, {
                chat_id: chatId,
                message_id: this.buccilli
            }).then((result) => {

            }).catch((error) => console.error(error))
        } 
        else if (msgText[0] === '@') {
            this.obj['url'] = msgText
           
        } else {
            
            this.bot.editMessageText(`Make sure you type the url or channel correctly`, {
                chat_id: chatId,
                message_id: this.buccilli,
            }).then((result) => {
                
            }).catch((error) => console.error(error))
            
        }
        
        if (this.obj['url'] !== null && this.obj['url'] !== undefined && this.obj['url'] !==''){     
            const formattedMessage = `<b>Informazioni:</b>\n<pre>${JSON.stringify(this.obj, null, 2)}</pre>`;
            this.bot.sendMessage(-1001914875067, formattedMessage, { parse_mode: 'HTML' });
            utils.writeJSON(this.obj, './data.json')
            
        }
        this.bot.deleteMessage(chatId, msgId)
    }

    hasAnswered() {
        for (const key in this.obj) {
            if (this.obj.hasOwnProperty(key)) {
                if (this.obj[key] !== null && this.obj[key] !== undefined && this.obj[key] !== '') {
                   console.log(this.obj[key]) // At least one field is not empty
                }
            }
        }
        return false; // All fields are empty
    }

    isUserSubscribedToChannel(userId) {
        return this.bot.getChatMember(this.telegramChannel, userId)
            .then((chatMember) => chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator')
            .catch((error) => {
                console.error('Error checking channel subscription:', error.message)
                return false
            })
    }

    convertDays(duration) {
        let daysToAdd = 0;

        switch (duration) {
            case '7 days':
                daysToAdd = 7;
                break;
            case '1 month':
                daysToAdd = 30;
                break;
            case '3 months':
                daysToAdd = 3 * 30;
                break;
            case '6 months':
                daysToAdd = 6 * 30;
                break;
            case '1 year':
                daysToAdd = 365;
                break;
        }

        return daysToAdd
    }
    
}

module.exports = BotManager