require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)


const handlePreCheckoutQuery = async(pre_checkout_query, bot) => {
    await bot.answerPreCheckoutQuery(pre_checkout_query.id, true)
}
const handleSuccessfulPayment = async(msg) => {
    console.log(msg.successful_payment)
}

module.exports = { handlePreCheckoutQuery, handleSuccessfulPayment }