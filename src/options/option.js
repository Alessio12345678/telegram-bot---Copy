const initialOption = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                { text: 'Sponsor 🚀', callback_data: 'sponsor'},
                { text: 'Our Things 📦', callback_data: 'ourthings'}
            ]
        ]
    })
};

const ourThings = {
    inline_keyboard: [
        [
            { text: 'Channel 📣', url: 'https://t.me/StellarCats_Meow' },
            { text: 'Sticker Pack 🐱', url: 'https://t.me/addstickers/Nekonyaaaa' }
        ],
        [
            { text: 'Animated Pack 😼', url: 'https://t.me/addstickers/StellarCats' },
            { text: 'Emoji premium 😻', url: 'www.pornhub.com' }
        ],
        [
            { text: 'Back ↩️', callback_data: 'back_initial' }
        ]
    ]
}

const sponsorOption = {
    inline_keyboard: [
        [
            { text: '•Sticker 🐱•', callback_data: '•sticker•'},
            { text: '•Channel 📣•', callback_data: '•channel•' },              
        ],
        [
            { text: '•Emoji Premium 😻•', callback_data: '•premium•' },
            { text: 'Back ↩️', callback_data: 'back_initial' }
        ]
    ],
}

const timeOption = {
    inline_keyboard: [
        [
            { text: '7 days 📆', callback_data: '7 days'},
            { text: '1 month 📆', callback_data: '1 month' }
        ],
        [
            { text: '3 months 📆', callback_data: '3 months' },
            { text: '6 months 📆', callback_data: '6 months' }
        ],
        [
            { text: '1 year 📆', callback_data: '1 year' },
            { text: 'Back ↩️', callback_data: 'back_sponsor' }
        ]
    ]
};

const nameOption = {
    inline_keyboard: [
        [
            { text: 'Back ↩️', callback_data: 'back_time' }
        ]
    ]
}

module.exports = { initialOption, timeOption, nameOption, ourThings, sponsorOption};
