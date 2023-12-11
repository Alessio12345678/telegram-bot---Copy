const keyboardOptions = require('./options/option.js') 
const utils = require('./utils.js')
class StateManager {
    constructor() {
        this.userNames = {};
        this.currentState = '' //nome 
        this.data = {}
        
    }
    
    async setData(id) {
        const userPreference = await utils.getUserPreferences(id)
        this.data = {
            'initial': {
                msg: userPreference.welcome.replace('{firstName}',this.getUserName(id)),
                value: { 
                    inline_keyboard: [
                        [
                            { text: userPreference.sponsor_btn, callback_data: 'sponsor'},
                            { text: userPreference.ourstuff_btn, callback_data: 'ourthings'}
                        ]
                    ]
                }
            },
            'ourthings' : {
                msg: userPreference.ourstuff,
                value: await keyboardOptions.ourThings(id)
            },
            'sponsor': {
                msg: userPreference.sponsor,
                value: await keyboardOptions.sponsorOption(id)
            },
            'time': {
                msg: userPreference.time ,
                value: await keyboardOptions.timeOption(id)
            },
            'name': {
                msg: userPreference.name,
                value: await keyboardOptions.nameOption(id)
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