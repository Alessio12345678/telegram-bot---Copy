const keyboardOptions = require('./options/option.js')
const utils = require('./utils.js')
class StateManager {
    constructor() {
        this.userNames = {};
        this.currentState = ''  
        this.data = {}
    }

    async setData(id, response, count, obj) {
        const userPreference = await utils.getUserPreferences(id)
        //console.log(response)
        response = (response !== undefined) ? response.split('•')[1] : ''
        //console.log(response)
        
        switch (response) {
            case 'sticker':
                response = `<b>${userPreference.stats_sticker}</b>`
                break;
            case 'animated':
                response = `<b>${userPreference.stats_animated}</b>`
                break;
            case 'channel':
                response = `<b>${userPreference.stats_channel.replace('{count}', count)}</b>\n\n`
                break;
        }
        this.data = {
            'initial': {
                msg: userPreference.welcome.replace('{firstName}', this.getUserName(id)),
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
                msg: response + userPreference.time,
                value: await keyboardOptions.timeOption(id)
            },
            'name': {
                msg: userPreference.name,
                value: await keyboardOptions.nameOption(id)
            },
            'pic': {
                msg: (obj['where'] === '•sticker•') ? userPreference.pic : (obj['where'] === '•animated•') ? userPreference.animated_instructions : (obj['where'] === '•channel•') ? userPreference.channel_pic : '',
                value: await keyboardOptions.picOption(id, obj)
            },
            'description': {
                msg: userPreference.description,
                value: await keyboardOptions.descriptionOption(id)
            },
            'confirmation': {
                msg: userPreference.final_message,
                value: null
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
        this.userNames[userId] = userName
    }

    getUserName(userId) {
        return this.userNames[userId]
    }
}

module.exports = StateManager