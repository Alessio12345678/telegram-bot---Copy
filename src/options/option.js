const initialOption = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                { text: '•Sticker 🐱•', callback_data: '•sticker•'},
                { text: '•Channel 📣•', callback_data: '•channel•' },              
            ],
            [
                { text: '•Emoji Premium 😻•', callback_data: '•premium•' }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    })
};

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
            { text: 'Back ↩️', callback_data: 'back_initial' }
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

module.exports = { initialOption, timeOption, nameOption };
