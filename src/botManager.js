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
const sponsorHandler = require('./sponsorHandler.js')
class BotManager {
    constructor(token, channel, webhookPath, commandsPath) {
        this.bot = new TelegramBot(token, { polling: false })
        this.telegramChannel = channel
        this.webhookPath = webhookPath
        this.commandsPath = commandsPath
        this.buccilli = {}
        this.obj = {}
        this.stateManager = {}

        this.setupWebhook()
        this.setupCommands()
        this.setupListeners()
    }
    setupWebhook() {
        const webhookUrl = `https://c14a-2001-b07-6463-6f86-99c1-3532-7aa4-37ce.ngrok-free.app${this.webhookPath}${this.bot.token}`
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
        this.bot.on('callback_query', (callbackQuery) => sponsorHandler.handleSponsor(callbackQuery, this.bot))
        this.bot.on('message', (msg) => this.handleMessage(msg))
    }


    async handleCommand(msg, command) {
        const chatId = msg.chat.id
        const userId = msg.from.id
        const isUserSubscribedToChannel = await this.isUserSubscribedToChannel(userId)
        
        const index = await utils.findIndexDataJson(userId,'./data.json')
        const index2 = await utils.findIndexDataJson(userId,'./accepted.json')

        if (isUserSubscribedToChannel && (index === false && index2 === false)) {
            console.log("Bonassia è entrato")
            const user = await utils.findUserJSON(userId, './userPreferences.json')
            if (!user || user === undefined) {
                await utils.writeJSON({
                    [userId]: 'english'
                },'./userPreferences.json')
            }
            if (!this.stateManager.hasOwnProperty(userId)) {
                this.stateManager[userId] = new StateManager()
            
            }
            if (this.buccilli[chatId] != null) { 
                console.log(this.buccilli[chatId])
                this.bot.deleteMessage(chatId, this.buccilli[chatId])
            }
            //stuff
            const stateManager = this.stateManager[userId]
            stateManager.setUserName(userId, msg.from.first_name)
            stateManager.setData(userId)
            stateManager.updateCurrentState('initial')
            //execute
            const botMsgId = await command.execute(this.bot, msg)
            this.buccilli[chatId] = botMsgId
            this.bot.deleteMessage(chatId, msg.message_id)
        
            
            
        } else {
            if (index !== false || index2 !== false) {
                const keyboard = await keyboardOptions.pendingOption(userId, index, index2)
                const userPreference = await utils.getUserPreferences(userId)
                const botMsgId = await this.bot.sendMessage(chatId, userPreference.pending,  {
                                    parse_mode: 'HTML',
                                    reply_markup: keyboard
                                })
                if (this.buccilli[chatId] != null) { 
                    this.bot.deleteMessage(chatId, this.buccilli[chatId])
                }

                this.buccilli[chatId] = botMsgId.message_id
                this.bot.deleteMessage(chatId, msg.message_id)

            }else{ 
                this.bot.sendMessage(chatId, `In order to use this bot, join our channel ${this.telegramChannel}.`)
                this.bot.sendSticker(chatId, stickers['sad'].fileId)
            }
        }
            
    }
    
    handleCallbackQuery(callbackQuery) {
        const response = callbackQuery.data
        const msgId = callbackQuery.message.message_id
        const chatId = callbackQuery.message.chat.id
        const userId = callbackQuery.from.id
        const stateManager = this.stateManager[userId]
        if(response === 'nothing') return
        this.buccilli[chatId] = msgId;
        if(response === `remove_${userId}` ||response.includes('confirm' ) || response.includes('deny') || response === `cancel_${userId}`) {
            // utils.removeUserJson(userId,'./data.json')
            return
            
        }
        stateManager.setData(userId)

        if(!this.obj[userId]) this.obj[userId] = {}
        const currentState = stateManager.getCurrentState() 
        if (response === 'italiano' || response === 'english') {
            utils.findUserJSON(userId, './userPreferences.json')
                .then((userPreference) => {
                    if (userPreference !== undefined && userPreference[userId] !== response) {
                       
                        userPreference[userId] = response
                        utils.updateJSON(userPreference, './userPreferences.json').then(() => {
                            utils.getUserPreferences(userId).then((userPreference) =>{
                                                this.bot.editMessageText(userPreference.choice_lang, {
                                                    chat_id: chatId,
                                                    message_id: msgId,
                                                    reply_markup: {
                                                        inline_keyboard: [
                                                            [
                                                                { text: 'Italiano 🇮🇹', callback_data: 'italiano' },
                                                                { text: 'English 🌍', callback_data: 'english' }
                                                            ],
                                                        ]
                                                    }
                                                })
                                            })
                        })
                    }
                })
            
               
            return
        }

    
        if (response === 'sponsor') { 
            stateManager.updateCurrentState("sponsor")
        }
        else if (response === 'ourthings') {
            stateManager.updateCurrentState("ourthings")
        }

        else if (currentState === 'sponsor') {
            this.obj[userId]['userId'] = callbackQuery.from.id
            this.obj[userId]['userName'] = callbackQuery.from.username
            this.obj[userId]['where'] = response
            stateManager.updateCurrentState("time")
            
            
        } else if (currentState === 'time') {
            // const date = new Date();
            this.obj[userId]['duration'] = response
            // this.obj[userId]['start_Date'] = date.toISOString().split('T')[0]
            // const date2 = new Date(date)
            // date2.setDate(date.getDate() + this.convertDays(response))
            // this.obj[userId]['end_Date'] =  date2.toISOString().split('T')[0]
            stateManager.updateCurrentState("pic")
        } else if (currentState === 'pic') {
            if (response === 'no_pic') 
                stateManager.updateCurrentState("description")
        } else if (currentState === 'description') {
            
        }
        
        
        if (response.split("_")[0] === 'back') {
            stateManager.updateCurrentState(response.split("_")[1]) //prende lo state precendete
            
            
        }
       
        const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
        this.bot.editMessageText(stateMod.msg, {
            chat_id: chatId,
            message_id: msgId,
            reply_markup: stateMod.value
        })
    }

    async handleMessage(msg) {
        const msgText = msg.text
        const chatId = msg.chat.id
        const userId = msg.from.id
        const msgId = msg.message_id

        //console.log("Bonassiola sempre pieno di problemi: ", msgText)

        if (msg.sticker) {
            console.log('it is a sticker')
            
        } else if (msg.photo) {
            const fileId = msg.photo[0].file_id
            const file = await this.bot.getFile(fileId)
            const imageUrl = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`
            if (utils.checkImg(imageUrl))
                console.log('it is a valid image')
            else 
                this.bot.deleteMessage(chatId, msgId)

        }
        else if (!msg.text && !msg.sticker) 
            this.bot.deleteMessage(chatId, msgId)
        
        if (!msg.text || msgText[0] == '/') return


        const stateManager = this.stateManager[userId]
        if (stateManager.getCurrentState() != 'name') return
        if (utils.isValidURL(msgText)) {
            this.obj[chatId]['url'] = msgText
            this.bot.deleteMessage(chatId, this.buccilli[userId])
        } 
        else if (msgText[0] === '@') {
            this.obj[chatId]['url'] = msgText
           
        } else {
            
            this.bot.editMessageText(`Make sure you type the url or channel correctly`, {
                chat_id: chatId,
                message_id: this.buccilli[userId],
            }).then((result) => {
                
            }).catch((error) => console.error(error))
            
        }

        
        if (this.obj[userId]['url'] !== null && this.obj[userId]['url'] !== undefined && this.obj[userId]['url'] !==''){     
            const formattedMessage = `<b>Informazioni:</b>\n<pre>${JSON.stringify(this.obj[userId], null, 2)}</pre>`;
            const groupMessage = await this.bot.sendMessage(-1001914875067, formattedMessage, {
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                { text: 'Accetta ✅', callback_data: `confirm_${userId}` },
                                                { text: 'Rifiuta ❌', callback_data: `deny_${userId}` }
                                            ],
                                            
                                        ]
                                    }
                                });
            

            utils.writeJSON(this.obj[userId], './data.json')
            const tempObj = {
                ["userId"] : userId,
                ["Id"] : groupMessage.message_id
                
            }
            utils.writeJSON(tempObj,'./groupMessageIds.json')
        }
        this.bot.deleteMessage(chatId, msgId)
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