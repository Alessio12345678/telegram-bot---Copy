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
const axios = require('axios')
const stripeEvents = require('./stripeEvents.js')

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
        const webhookUrl = `https://a094-2001-b07-6463-6f86-9061-378f-2bf3-2edd.ngrok-free.app${this.webhookPath}${this.bot.token}`
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
        //payment stuff
        //this.bot.on('pre_checkout_query', (pre_checkout_query) => stripeEvents.handlePreCheckoutQuery(pre_checkout_query, this.bot))
        //this.bot.on('successful_payment', (msg) => stripeEvents.handleSuccessfulPayment(msg))
    }


    async handleCommand(msg, command) {
        const chatId = msg.chat.id
        const userId = msg.from.id
        const isUserSubscribedToChannel = await this.isUserSubscribedToChannel(userId)
        
        const index = await utils.findIndexDataJson(userId,'./data.json')
        const index2 = await utils.findIndexDataJson(userId,'./accepted.json')

        if (isUserSubscribedToChannel && (index === false && index2 === false)) {
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
                //console.log(this.buccilli[chatId])
                this.bot.deleteMessage(chatId, this.buccilli[chatId])
            }
            //stuff
            const stateManager = this.stateManager[userId]
            stateManager.setUserName(userId, msg.from.first_name)
            stateManager.setData(userId, '', 0, this.obj)
            stateManager.updateCurrentState('initial')
            //execute
            const botMsgId = await command.execute(this.bot, msg)
            this.buccilli[chatId] = botMsgId
            this.bot.deleteMessage(chatId, msg.message_id)
        
            
            
        } else {
            // payment stuff
            // const utente = await utils.findUserJSON1(userId, './accepted.json')
            // if (utente['payed'] === undefined && index2 === 0) {
            //     const userPreference = await utils.getUserPreferences(userId)
            //     this.bot.sendInvoice(
            //         chatId, 
            //         userPreference.title_invoice, 
            //         userPreference.description_invoice,
            //         'payload', 
            //         process.env.STRIPE_TEST, 
            //         'EUR', 
            //         [
            //             { label: userPreference.labeled_price, amount: 100 }
            //         ]
            //     )
            // }
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

            } else { 
                this.bot.sendMessage(chatId, `In order to use this bot, join our channel ${this.telegramChannel}.`, { parseMode: 'Markdown' })
                this.bot.sendSticker(chatId, stickers['sad'].fileId)
            }
        }
            
    }
    
    async handleCallbackQuery(callbackQuery) {
        const response = callbackQuery.data
        const msgId = callbackQuery.message.message_id
        const chatId = callbackQuery.message.chat.id
        const userId = callbackQuery.from.id
        const stateManager = this.stateManager[userId]

        if (response === 'yes') {
            let groupMessage
            if (this.obj[userId].hasOwnProperty('imageUrl')) {
                if (this.obj[userId]['where'] === '•animated•') {
                    await this.bot.sendDocument(-1001914875067, this.obj[userId]['imageUrl'])
                    groupMessage = await this.bot.sendMessage(-1001914875067, `<b>Informazioni Utente:</b>\nUtente: ${this.obj[userId]['userName']}\nDove: ${this.obj[userId]['where'].replace(/•/g, '')}\nDurata: ${this.obj[userId]['duration']}`, {
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
                } else {
                    const response = await axios.get(this.obj[userId]['imageUrl'], { responseType: 'arraybuffer' });
                    const fileBuffer = Buffer.from(response.data, 'binary')
                    const desp = (this.obj[userId]['where'] === '•channel•') ? `Descrizione: ${this.obj[userId]['description']}\nUrl/Channel: ${this.obj[userId]['url']}\n\n` : ''
                    if (this.obj[userId]['where'] !== '•channel•') await this.bot.sendDocument(-1001914875067, fileBuffer)
                    
                    if (this.obj[userId]['imageUrl'].includes('mp4') || this.obj[userId]['imageUrl'].includes('gif')){
                        groupMessage = await this.bot.sendVideo(-1001914875067, fileBuffer, {
                            parse_mode: 'HTML',
                            caption: `${desp}<b>Informazioni Utente:</b>\nUtente: ${this.obj[userId]['userName']}\nDove: ${this.obj[userId]['where'].replace(/•/g, '')}\nDurata: ${this.obj[userId]['duration']}`,
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: 'Accetta ✅', callback_data: `confirm_${userId}` },
                                        { text: 'Rifiuta ❌', callback_data: `deny_${userId}` }
                                    ],
                                    
                                ]
                            }
                        });
                    } else {
                        groupMessage = await this.bot.sendPhoto(-1001914875067, fileBuffer, {
                                            parse_mode: 'HTML',
                                            caption: `${desp}<b>Informazioni Utente:</b>\nUtente: ${this.obj[userId]['userName']}\nDove: ${this.obj[userId]['where'].replace(/•/g, '')}\nDurata: ${this.obj[userId]['duration']}`,
                                            reply_markup: {
                                                inline_keyboard: [
                                                    [
                                                        { text: 'Accetta ✅', callback_data: `confirm_${userId}` },
                                                        { text: 'Rifiuta ❌', callback_data: `deny_${userId}` }
                                                    ],
                                                    
                                                ]
                                            }
                                        });
                        }
                }
            } else {
                groupMessage = await this.bot.sendMessage(-1001914875067, `<b>Senza foto</b>\nDescrizione: ${this.obj[userId]['description']}\nUrl/Channel: ${this.obj[userId]['url']}\n\n<b>Informazioni Utente:</b>\nUtente: ${this.obj[userId]['userName']}\nDove: ${this.obj[userId]['where'].replace(/•/g, '')}\nDurata: ${this.obj[userId]['duration']}`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Accetta ✅', callback_data: `confirm_${userId}` },
                                { text: 'Rifiuta ❌', callback_data: `deny_${userId}` }
                            ],
                            
                        ]
                    }
                })
            }
            

            utils.writeJSON(this.obj[userId], './data.json')
            const tempObj = {
                ["userId"] : userId,
                ["Id"] : groupMessage.message_id
                
            }
            utils.writeJSON(tempObj,'./groupMessageIds.json')
        }


        if(response === 'nothing') return
        this.buccilli[chatId] = msgId;
        if(response === `remove_${userId}` ||response.includes('confirm' ) || response.includes('deny') || response === `cancel_${userId}`) {
            // utils.removeUserJson(userId,'./data.json')
            return
            
        }
        // stateManager.setData(userId, this.obj[userId]?.where)

        if(!this.obj[userId]) this.obj[userId] = {}
        const currentState = stateManager.getCurrentState() 
        if (response === 'italiano' || response === 'english') {
            utils.findUserJSON(userId, './userPreferences.json')
                .then((userPreference) => {
                    if (userPreference !== undefined && userPreference[userId] !== response) {
                       
                        userPreference[userId] = response
                        utils.updateJSON(userPreference, './userPreferences.json').then(() => {
                            utils.getUserPreferences(userId).then((userPreference) => {
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
            if (response === 'no_pic') {
                delete this.obj[userId]['imageUrl']
                stateManager.updateCurrentState("description")
            }
            
        } else if (currentState === 'confirmation') {
            //console.log('daje')
        }
        
        
        if (response.split("_")[0] === 'back') {
            stateManager.updateCurrentState(response.split("_")[1]) //prende lo state precendete
            // if (response.split("_")[1] === 'name') {
            //     const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
            //     this.bot.editMessageMedia(stateMod.msg, {
            //         chat_id: chatId,
            //         message_id: msgId,
            //         reply_markup: stateMod.value
            //     })
            // }
            // if (response.split("_")[1] === 'name' && this.obj[userId]['imageUrl']) {
            //     const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
            //     this.bot.editMessageMedia(stateMod.msg, {
            //         chat_id: chatId,
            //         message_id: msgId,
            //         reply_markup: stateMod.value
            //     })
            //     return
            // }
        }
        await stateManager.setData(userId, this.obj[userId]?.where, await this.getChatMemberCount(), this.obj[userId])
        //console.log('currentState: ', stateManager.getCurrentState())
        
        const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
        this.bot.editMessageText(stateMod.msg, {
            parse_mode: 'HTML',
            chat_id: chatId,
            message_id: msgId,
            reply_markup: stateMod.value
        }).catch(async (error) => {
            
            this.bot.deleteMessage(chatId, msgId)
            const { message_id } = await this.bot.sendMessage(chatId, stateMod.msg, {
                                    reply_markup: stateMod.value
                                })
            
            this.buccilli[userId] = message_id
        })
        
    }

    async handleMessage(msg) {
        const msgText = msg.text
        const chatId = msg.chat.id
        const userId = msg.from.id
        const msgId = msg.message_id
        const stateManager = this.stateManager[userId]
        //console.log("Bonassiola sempre pieno di problemi: ", msgText)
        
        if (msg.document) {
            const fileId = msg.document.file_id
            const file = await this.bot.getFile(fileId)
            const imageUrl = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`
            console.log(imageUrl)
            if(this.obj[userId]['where'] === '•channel•' && await utils.checkChannelImage(imageUrl)) {
                stateManager.updateCurrentState('description')
                const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
                this.bot.editMessageText(stateMod.msg, {
                    chat_id: chatId,
                    message_id: this.buccilli[userId],
                    reply_markup: stateMod.value
                })
                this.obj[userId]['imageUrl'] = imageUrl
            }
            else if (await utils.checkImg(imageUrl) && this.obj[userId]['where'] === '•sticker•') {
                //console.log('it is a valid image')
                const userPreference = await utils.getUserPreferences(userId)
                this.bot.deleteMessage(chatId, this.buccilli[userId])
                this.obj[userId]['imageUrl'] = imageUrl
                const response = await axios.get(this.obj[userId]['imageUrl'], { responseType: 'arraybuffer' });
                const fileBuffer = Buffer.from(response.data, 'binary');
                const stolen = await this.bot.sendPhoto(chatId, fileBuffer, {
                    
                    
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: userPreference.confirmation_btn, callback_data: 'yes' },
                                { text: userPreference.back_btn, callback_data: 'back_pic' }
                            ]
                        ]
                    }
                })
                this.buccilli[userId] = stolen.message_id
                stateManager.updateCurrentState('confirmation')
                // const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
                // this.bot.editMessageText(stateMod.msg, {
                //     chat_id: chatId,
                //     message_id: this.buccilli[userId],
                //     reply_markup: stateMod.value
                // })
                // const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                // const fileBuffer = Buffer.from(response.data, 'binary');
                // this.bot.sendPhoto(chatId, fileBuffer)
            }
            this.bot.deleteMessage(chatId, msgId)
        }
        else if (msg.sticker) {
            console.log('ce qualcosa che fa rumore')
            const fileId = msg.sticker.file_id
            const file = await this.bot.getFile(fileId)
            const imageUrl = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`
            console.log(imageUrl)

            if(await utils.checkTgs(imageUrl) && this.obj[userId]['where'] === '•animated•') {
                const userPreference = await utils.getUserPreferences(userId)
                
                this.bot.deleteMessage(chatId, this.buccilli[userId])
                this.obj[userId]['imageUrl'] = fileId
                const stolen = await this.bot.sendSticker(chatId, fileId, {
                    
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: userPreference.confirmation_btn, callback_data: 'yes' },
                                { text: userPreference.back_btn, callback_data: 'back_pic' }
                            ]
                        ]
                    }
                })
                this.buccilli[userId] = stolen.message_id
                stateManager.updateCurrentState('confirmation')
                // const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
                // this.bot.editMessageText(stateMod.msg, {
                //     chat_id: chatId,
                //     message_id: this.buccilli[userId],
                //     reply_markup: stateMod.value
                // })
                
                this.bot.deleteMessage(chatId, msgId)
            }
            
        }
        else if (!msg.text && !msg.sticker) 
           this.bot.deleteMessage(chatId, msgId)
        
        
        

        
        if (!msg.text || msgText[0] == '/') return

        //console.log('currentState: ', stateManager.getCurrentState())
        if (stateManager.getCurrentState() === 'description') {
            this.obj[userId]['description'] = msgText
            stateManager.updateCurrentState('name')
            const stateMod = stateManager.getStateByName(stateManager.getCurrentState())
            this.bot.editMessageText(stateMod.msg, {
                chat_id: chatId,
                message_id: this.buccilli[userId],
                reply_markup: stateMod.value
            })

        }
        else if (stateManager.getCurrentState() === 'name') {
            if (utils.isValidURL(msgText)) {
                this.obj[chatId]['url'] = msgText
                this.bot.deleteMessage(chatId, this.buccilli[userId])
                stateManager.updateCurrentState('confirmation')
            } 
            else if (msgText[0] === '@') {
                this.obj[chatId]['url'] = msgText
                stateManager.updateCurrentState('confirmation')
                
            } else {
                this.bot.editMessageText(`Make sure you type the url or channel correctly`, {
                    chat_id: chatId,
                    message_id: this.buccilli[userId],
                })
            }
        }
        if (stateManager.getCurrentState() === 'confirmation') {
            const userPreference = await utils.getUserPreferences(userId)
            if (this.obj[userId].hasOwnProperty('imageUrl')) {
                const msgWithLink = this.obj[userId]["description"].replaceAll('{link}', this.obj[userId]['url'])
                const response = await axios.get(this.obj[userId]['imageUrl'], { responseType: 'arraybuffer' });
                const fileBuffer = Buffer.from(response.data, 'binary');
                const msgLinkTemp = + (this.obj[userId]['description'].includes('{link}')) ? '' : `\n\n${this.obj[userId]['url']}`
                if (this.obj[userId]['imageUrl'].includes('mp4') || this.obj[userId]['imageUrl'].includes('gif')){
                    this.bot.sendVideo(chatId, fileBuffer, {
                        parse_mode: 'HTML',
                        caption: `<b>${userPreference.confirmation_msg}</b>` + `\n\n${msgWithLink}` + msgLinkTemp,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: userPreference.confirmation_btn, callback_data: 'yes' },
                                    { text: userPreference.back_btn, callback_data: 'back_name' }
                                ],
                                
                            ]
                        }
                    });
                } else 
                     this.bot.sendPhoto(chatId, fileBuffer, {
                        parse_mode: 'HTML',
                        caption: `<b>${userPreference.confirmation_msg}</b>` + `\n\n${msgWithLink}` + msgLinkTemp,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: userPreference.confirmation_btn, callback_data: 'yes' },
                                    { text: userPreference.back_btn, callback_data: 'back_name' }
                                ]
                            ]
                        }
                    })
            } else {
                const msgWithLink = this.obj[userId]["description"].replaceAll('{link}', this.obj[userId]['url'])
                const msgLinkTemp = + (this.obj[userId]['description'].includes('{link}')) ? '' : `\n\n${this.obj[userId]['url']}`
                this.bot.sendMessage(chatId, `<b>${msgWithLink}</b>` + msgLinkTemp, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: userPreference.confirmation_btn, callback_data: 'yes' },
                                { text: userPreference.back_btn, callback_data: 'back_name' }
                            ]
                        ]
                    }
                })
            }
            
        }
        
        // if (this.obj[userId]['url'] !== null && this.obj[userId]['url'] !== undefined && this.obj[userId]['url'] !=='') {     
        //     const formattedMessage = `<b>Informazioni:</b>\n<pre>${JSON.stringify(this.obj[userId], null, 2)}</pre>`;
        //     const groupMessage = await this.bot.sendMessage(-1001914875067, formattedMessage, {
        //                             parse_mode: 'HTML',
        //                             reply_markup: {
        //                                 inline_keyboard: [
        //                                     [
        //                                         { text: 'Accetta ✅', callback_data: `confirm_${userId}` },
        //                                         { text: 'Rifiuta ❌', callback_data: `deny_${userId}` }
        //                                     ],
                                            
        //                                 ]
        //                             }
        //                         });
            

        //     utils.writeJSON(this.obj[userId], './data.json')
        //     const tempObj = {
        //         ["userId"] : userId,
        //         ["Id"] : groupMessage.message_id
                
        //     }
        //     utils.writeJSON(tempObj,'./groupMessageIds.json')
        // }
        this.bot.deleteMessage(chatId, msgId)
    }

    isUserSubscribedToChannel(userId) {
        return this.bot.getChatMember('@'+this.telegramChannel.split('/')[3], userId)
            .then((chatMember) => chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator')
            .catch((error) => {
                console.error('Error checking channel subscription:', error.message)
                return false
            })
    }

    async getChatMemberCount() {
       return await this.bot.getChatMemberCount(-1001437370667)
    }

    getInstance() {
        return this
    }

    Owls() {
        
    }
}

module.exports = BotManager 