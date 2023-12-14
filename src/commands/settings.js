module.exports = {
    name: 'settings',
    execute: function (bot, msg) {
        const chatId = msg.chat.id
        const msgId = msg.message_id
        bot.sendMessage(chatId, 'Choose your language:', {
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
        
    }
}