const fs = require('fs').promises
const validator =  require('validator')
const moment = require('moment')
const imageSize = require('image-size')
const axios = require('axios');

const isValidURL = url => {
    return validator.isURL(url)
}

const readJSON = async (name) => {
    try {
      const data = await fs.readFile(`${name}`, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to read JSON file:', error.message)
      return []
    }
}

const writeJSON = async (obj, name) => {
    try {
        const cData = await readJSON(name)
        cData.push(obj)
        const jsonString = JSON.stringify(cData, null, 2)
        await fs.writeFile(`${name}`, jsonString, 'utf-8')
    } catch (error) {
        console.error('Failed to write JSON file:', error.message)
    }
}

const findUserJSON = async (userId, name) => {
    const json = await readJSON(name)
    
    if (json.length == 0) return false

    const userFound = json.find(userObject => {
        const userKey = Object.keys(userObject)[0]
        return userKey == userId
    })
    return userFound
}

const findUserJSON1 = async (userId, name) => {
    const json = await readJSON(name)
    
    if (json.length == 0) return false

    const userFound = json.find(userObject => {
        const userKey = Object.keys(userObject)[0]
        return (userObject[userKey] == userId)  ? userObject[userKey] : undefined
    })
    return userFound
}

const findIndexDataJson = async (userId, name) => {
    const json = await readJSON(name)
    if (json.length == 0) return false
    const index = json.findIndex(userObject => {
        const userKey = Object.keys(userObject)[0]
        return userObject[userKey] == userId
    })

    if(index == -1) return false

    return index
}


const updateJSON = async (obj, name) => {
    try {
        const cData = await readJSON(name)
        
        const indexToUpdate = cData.findIndex(user => Object.keys(user)[0] === Object.keys(obj)[0])

            cData[indexToUpdate] = obj


        const jsonString = JSON.stringify(cData, null, 2)
        await fs.writeFile(`${name}`, jsonString, 'utf-8')
    } catch (error) {
        console.error('Failed to update JSON file:', error.message)
    }
}

loadLanguageStrings = async (language) => {
    const filePath = `./src/languages/${language}.json`
    const jsonString = await readJSON(filePath)
    return jsonString
}

getUserPreferences = async (id) => {
    try {
      const userPreference = await findUserJSON(id, './userPreferences.json')
      const lang = await loadLanguageStrings(userPreference[id])
      return lang
    } catch (error) {
      console.error('Error:', error)
    }
}

const removeJSON = async (userId, name) => {
    try {
        const indexToRemove = await findIndexDataJson(userId, name)

        if (indexToRemove !== false) {
            const json = await readJSON(name)
            json.splice(indexToRemove, 1)

            const jsonString = JSON.stringify(json, null, 2)
            await fs.writeFile(name, jsonString, 'utf-8')
        }
    } catch (error) {
        console.error("Failed to remove json object: ", error.message)
    }

}

const estimateWait = async (index2) => {
    const json = await readJSON('./accepted.json')
    let sum = []
    console.log(json.length)
    for (let i = 0; i < json.length; i++) 
        if (i !== index2)
            sum.push(json[i]['duration'])
    
    const currentDate = moment()
    const estimatedDate = moment(currentDate)
    for (let item of sum) {
        const parts = item.split(' ')
        const value = parseInt(parts[0])
        const unit = parts[1]
        
        if (unit.includes('day')) currentDate.add(value, 'days')
    }
    const duration = moment.duration(currentDate.diff(estimatedDate))
    const years = duration.years()
    const months = duration.months()
    const days = duration.days()
    return `${years}Y${months}M${days}D`
}

const remainingDays = async () => {
    const json = await readJSON('./accepted.json')
    if(json.length == 0) return
    const startDate = moment(json[0]['startDate'], "MM/DD/YYYY")
    const endDate = moment(json[0]['endDate'],  "MM/DD/YYYY")
    const duration = moment.duration(endDate.diff(startDate))
    return duration.days()
    
}

const dateChecker = (endDate) => {
    return moment().format('MM/DD/YYYY') === endDate
}

const acceptedUpdater = async () => {
    const json = await readJSON('./accepted.json')
    if (json.length === 0) return
    //prendiamo il primo utente


    //controliamo se ha lo startDate, se no glie lo si mette insieme a endDate
    if(!json[0]["startDate"]) {
        json[0]["startDate"] = moment().format('MM/DD/YYYY')
        json[0]["endDate"] = moment().add(await convertDays(json[0]['duration']), 'days').format('MM/DD/YYYY')
        const jsonString = JSON.stringify(json, null, 2)
        await fs.writeFile('./accepted.json', jsonString, 'utf-8')
        //
    }

    if(dateChecker(json[0]["endDate"])) {
        await removeJSON(json[0]["userId"],'./accepted.json')
    }

    //oppure a dateChecker si passa endDate, e fa il controllo, e finchè non sono uguali non fa nulla
}

setInterval(acceptedUpdater, 10000)


const convertDays = async (duration) => {
    let daysToAdd = 0

    switch (duration) {
        case '1 day':
            daysToAdd = 1
            break
        case '3 days':
            daysToAdd = 3
            break
        case '7 days':
            daysToAdd = 7
            break
    }

    return daysToAdd
}

const checkImg = async (imageUrl) => {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const dimensions = imageSize(response.data);
        const { width, height, type } = dimensions;
        console.log("dimensions: ", dimensions);
        return (((width <= 512 && height === 512) || (width === 512 && height <= 512)) && (type === 'png' || type === 'webp'));
    } catch (error) {
        console.error(error)
    }
    
}
module.exports = { isValidURL, readJSON, writeJSON, findUserJSON, updateJSON, loadLanguageStrings, getUserPreferences, findUserJSON1, findIndexDataJson, removeJSON, estimateWait, remainingDays, checkImg }