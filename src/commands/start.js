const keyboardOptions = require('../options/option.js')
const utils = require('../utils.js')




//Chiedere dove
//Chiedere per quanto
//Chiedere di fornirci link/canale telegram
//data odierna
//data fine


module.exports = {
    name: 'start',
    execute: async function(bot, msg) {
        const chatId = msg.chat.id
        const userPreference = await utils.getUserPreferences(msg.from.id)
        const keyboard = await keyboardOptions.initialOption(msg.from.id)
        const impaccire = await bot.sendMessage(chatId, userPreference.welcome.replace('{firstName}', msg.from.first_name), keyboard)
        // console.log(impaccire)
        return impaccire.message_id
        
    }
}