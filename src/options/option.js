const utils = require('./../utils.js')

const initialOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    { text: userPreference.sponsor_btn, callback_data: 'sponsor'},
                    { text: userPreference.ourstuff_btn, callback_data: 'ourthings'}
                ]
            ]
        })
    }
        
}

const ourThings = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        
            inline_keyboard: 
            [
                
                [
                    { text: userPreference.channel_btn, url: 'https://t.me/StellarCats_Meow' },
                    { text: userPreference.stickerPack_btn, url: 'https://t.me/addstickers/Nekonyaaaa' }
                ],
                [
                    { text: userPreference.animatedPack_btn, url: 'https://t.me/addstickers/StellarCats' },
                    { text: userPreference.emoji_btn, url: 'www.pornhub.com' }
                ],
                [
                    { text: userPreference.back_btn, callback_data: 'back_initial' }
                ]
            
            ]
        
    }
}

const sponsorOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        inline_keyboard: [
            [
                { text: userPreference.sticker_btn, callback_data: '•sticker•'},
                { text: userPreference.channel_btn, callback_data: '•channel•' },              
            ],
            [
                { text: userPreference.emoji_btn, callback_data: '•premium•' },
                { text: userPreference.back_btn, callback_data: 'back_initial' }
            ]
        ],
    }
    
}

const timeOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        inline_keyboard: [
            [
                { text: userPreference.days_btn7, callback_data: '7 days'},
                { text: userPreference.month_btn1, callback_data: '1 month' }
            ],
            [
                { text: userPreference.months_btn3, callback_data: '3 months' },
                { text: userPreference.months_btn6, callback_data: '6 months' }
            ],
            [
                { text: userPreference.year_btn1, callback_data: '1 year' },
                { text: userPreference.back_btn, callback_data: 'back_sponsor' }
            ]
        ]
    }
    
};

const nameOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return { 
        inline_keyboard: [
            [
                { text: userPreference.back_btn, callback_data: 'back_time' }
            ]
        ]
    }
}

module.exports = { initialOption, timeOption, nameOption, ourThings, sponsorOption };