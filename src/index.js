require('dotenv').config()
const BotManager = require('./botManager.js')
const botManager = new BotManager(process.env.TOKEN, 'https://t.me/StellarCats_Meow', '/telegram-webhook/', 'commands');
