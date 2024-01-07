const utils =  require('./utils.js')
const handleSponsor = async (callbackQuery, bot) => {
    const response = callbackQuery.data
    const msgId = callbackQuery.message.message_id
    const chatId = callbackQuery.message.chat.id
    const userId = callbackQuery.from.id
    if (response.includes('confirm')) { 
        const temp = response.split('_')
        utils.findUserJSON1(temp[1],'./data.json').then((obj) => {
            if (obj != false && obj != null && obj != undefined ) {
                utils.writeJSON(obj,'./accepted.json')
                utils.removeJSON(temp[1],'./data.json')
                bot.editMessageReplyMarkup({
                    inline_keyboard: [
                        [
                            { text: 'Confermato ✅', callback_data: 'nothing' },
                        ],
                    ]
                }, {chat_id: chatId, message_id: msgId})
            }
            else {
                bot.editMessageReplyMarkup({
                    inline_keyboard: [
                        [
                            { text: 'Richiesta cancellata ⚠️', callback_data: 'nothing' },
                        ],
                    ]
                }, {chat_id: chatId, message_id: msgId})
            }
        })
    }   

    if (response.includes('deny')) {
        const temp = response.split('_')
        const value = await utils.findUserJSON1(userId, './groupMessageIds.json')
        utils.removeJSON(temp[1],'./data.json')
        
        bot.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    { text: 'Rifiutato ❌', callback_data: 'nothing' },
                ],
            ]
        }, {chat_id: chatId, message_id: msgId})
        await utils.removeJSON(userId, './groupMessageIds.json')
    }

    if(response === `remove_${userId}`) {
        await checkRequestValidity(userId, bot)
        utils.removeJSON(userId,'./data.json')
        bot.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    { text: 'Cancellato ❌', callback_data: 'nothing' },
                ],
            ]
        }, {chat_id: chatId, message_id: msgId})
    }

    if(response === `cancel_${userId}`) {
        await checkRequestValidity(userId, bot)
        utils.removeJSON(userId,'./accepted.json')
        bot.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    { text: 'Cancellato ❌', callback_data: 'nothing' },
                ],
            ]
        }, {chat_id: chatId, message_id: msgId})
    }



}


const checkRequestValidity = async (userId, bot) => { 
    const value = await utils.findUserJSON1(userId, './groupMessageIds.json')

    // const json = await utils.readJSON('./groupMessageIds.json')
    

    bot.editMessageReplyMarkup({
        inline_keyboard: [
            [
                { text: 'Richiesta cancellata ⚠️', callback_data: 'nothing' },
            ],
        ]
    }, {chat_id: -1001914875067, message_id: value['Id']})

    await utils.removeJSON(userId, './groupMessageIds.json')

}

// [
//     { text: 'Accetta ✔️', callback_data: `confirm_${chatId}` },
//     { text: 'Rifiuta ❌', callback_data: `deny_${chatId}` }
// ],
module.exports = { handleSponsor }