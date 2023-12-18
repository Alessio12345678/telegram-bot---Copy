const utils = require('../utils.js')

module.exports = {
    name: 'settings',
    execute: async  function (bot, msg) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        const userPreference = await utils.getUserPreferences(msg.from.id)
        const bonassia = await bot.sendMessage(chatId, userPreference.choice_lang, {
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
        return bonassia.message_id
    }

    
}