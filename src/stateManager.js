const keyboardOptions = require('./options/option.js')

class StateManager {
    constructor() {
        this.currentState = '' //nome 
        this.data = {
            'initial': {
                msg: 'Welcome first_name!\nTo start, choose an option to sponsor your channel/website or else',
                value: {
                    inline_keyboard: [
                        [
                            { text: '•Sticker 🐱•', callback_data: '•sticker•'},
                            { text: '•Channel 📣•', callback_data: '•channel•' },              
                        ],
                        [
                            { text: '•Emoji Premium 😻•', callback_data: '•premium•' }
                        ]
                    ],
                }
            },
            'time': {
                msg: 'How long do you want to be sponsored for?' ,
                value: keyboardOptions.timeOption
            },
            'name': {
                msg: 'What is your channel/website name?',
                value: keyboardOptions.nameOption
            }
        } //data['campo'] = inline_keybaord...
    }

    getCurrentState() {
        return this.currentState
    }

    updateCurrentState(newState) {
        this.currentState = newState
    }

    getStateByName(stateName) {
        return this.data[stateName]
    }

    getAllStates() {
        return { ...data }
    }
}

module.exports = StateManager