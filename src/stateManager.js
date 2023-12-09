const keyboardOptions = require('./options/option.js') 
class StateManager {
    constructor() {
        this.userNames = {};
        this.currentState = '' //nome 
        this.data = {}
        this.setData()
    }

    setData(id) {
        //const welcomeMessage = (userId) => `Welcome ${this.getUserName(userId)}! In order to use our service`;
        this.data = {
            'initial': {
                msg: `Welcome ${this.getUserName(id)}! In order to use our service`,
                value: { 
                    inline_keyboard: [
                        [
                            { text: 'Sponsor 🚀', callback_data: 'sponsor'},
                            { text: 'Our Things 📦', callback_data: 'ourthings'}
                        ]
                    ]
                }
            },
            'ourthings' : {
                msg: 'Here you will find our stickers or our channel!',
                value: keyboardOptions.ourThings
            },
            'sponsor': {
                msg: 'To start, choose an option to sponsor your channel/website or else',
                value: keyboardOptions.sponsorOption
            },
            'time': {
                msg: 'How long do you want to be sponsored for?' ,
                value: keyboardOptions.timeOption
            },
            'name': {
                msg: 'What is your channel/website name?',
                value: keyboardOptions.nameOption
            }
        }
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

    setUserName(userId, userName) {
        this.userNames[userId] = userName;
    }

    getUserName(userId) {
        return this.userNames[userId];
    }
}

module.exports = StateManager