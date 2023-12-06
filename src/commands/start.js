const keyboardOptions = require('../options/option.js')






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
        

        bot.sendMessage(chatId, `Welcome ${msg.from.first_name}!\nTo start, choose an option to sponsor your channel/website or else`, keyboardOptions.initialOption)
            .then((sentMessage) => {
                welcomeId = sentMessage.message_id
            })
            .catch((error) => {
                console.error(error)
            })
        
        
        
    }
}