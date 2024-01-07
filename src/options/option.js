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
                // { text: userPreference.emoji_btn, callback_data: '•premium•' },
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
                { text: userPreference.days_btn1, callback_data: '1 day'},
                { text: userPreference.days_btn3, callback_data: '3 days' }
            ],
            [
                { text: userPreference.days_btn7, callback_data: '7 days' },
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
                { text: userPreference.back_btn, callback_data: 'back_description' }
            ]
        ]
    }
}

const pendingOption = async (id, index1, index2) => {
    const userPreference = await utils.getUserPreferences(id)
    const user = await utils.findUserJSON1(id, './accepted.json')
    //payment stuff
    // const payment = {
    //     inline_keyboard: [
    //         [{ text: userPreference.delete_request, callback_data: (index1 !== false) ? `remove_${id}` : `cancel_${id}` }]
    //     ]
    // }
    const activated = {
        inline_keyboard: [
            [{ text: userPreference.activated, callback_data: 'nothing' }],
            [{text:  userPreference.days_left + await utils.remainingDays(), callback_data: 'nothing'}]
        ]
    }
    const danger = {
        inline_keyboard: [
            [{ text: userPreference.position + (index2 + 1) , callback_data: 'nothing' }],
            [{ text: userPreference.estimated_waiting + await utils.estimateWait(index2)  , callback_data: 'nothing' }],
            [{ text: userPreference.status + ((index2 !== false) ? userPreference.in_queue : userPreference.waiting), callback_data: 'nothing' }],
            [{ text: userPreference.delete_request, callback_data: (index1 !== false) ? `remove_${id}` : `cancel_${id}` }]
        ]
    }
    const warning = {
        inline_keyboard: [
            [{ text: userPreference.status + ((index2 !== false) ? userPreference.in_queue : userPreference.waiting), callback_data: 'nothing' }],
            [{ text: userPreference.delete_request, callback_data: (index1 !== false) ? `remove_${id}` : `cancel_${id}` }]
        ]
    }
    // with payment
    // if(index2 === 0 && user['payed'] === undefined ) return payment
    // if (index2 === 0 && user['payed']) return activated
    if (index2 === 0) return activated
    if (index2 !== false) return danger
    return warning
}

const picOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        inline_keyboard: [
            [
                { text: userPreference.no_pic_btn, callback_data: "no_pic"},
                { text: userPreference.back_btn, callback_data: "back_time"},
            ]
        ]
    }
}

const descriptionOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        inline_keyboard: [
            [{ text: userPreference.back_btn, callback_data: "back_pic"}]
        ]
    }
}

const previewConfirmationOption = async (id) => {
    const userPreference = await utils.getUserPreferences(id)
    return {
        inline_keyboard: [
            [
                { text: userPreference.confirmation_btn, callback_data: "confirmation"},
                { text: userPreference.back_btn, callback_data: "back_name"}
            ]
        ]
    }
}

module.exports = { initialOption, timeOption, nameOption, ourThings, sponsorOption, pendingOption, picOption, descriptionOption, previewConfirmationOption };