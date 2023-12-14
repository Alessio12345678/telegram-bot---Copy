require('dotenv').config()
const BotManager = require('./botManager.js')
const botManager = new BotManager(process.env.TOKEN, '@StellarCats_Meow', '/telegram-webhook/', 'commands');
