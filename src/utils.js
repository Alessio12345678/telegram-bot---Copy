const fs = require('fs').promises
const validator =  require('validator')

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
    
    if (json.length == 0) return false;

    const userFound = json.find(userObject => {
        const userKey = Object.keys(userObject)[0]
        return userKey == userId
    })
    return userFound
}

const findUserJSON1 = async (userId, name) => {
    const json = await readJSON(name)
    
    if (json.length == 0) return false;

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
    json.forEach(element => {
        sum.push(element['duration'])
    });
    let ans = 0
    for (let item of sum) {
        const parts = item.split(' ')
        const value = parseInt(parts[0])
        const unit = parts[1]
        console.log(unit)
        if (unit.includes('day')) ans += value
        else if (unit.includes('month')) ans += value * 30
        else if (unit.includes('year')) ans += value * 365
    }

    const days = ans % 30
    const month = Math.floor((ans % 365) / 30)
    const years = Math.floor(ans / 365)
    console.log(days+"   "+month + "   " + years)

    return `0 ore`
}

module.exports = { isValidURL, readJSON, writeJSON, findUserJSON, updateJSON, loadLanguageStrings, getUserPreferences, findUserJSON1, findIndexDataJson, removeJSON, estimateWait }