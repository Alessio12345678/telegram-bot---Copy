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
// const removeUserJson = async (userId, name) => {
//     console.log(name)
//     const json = await readJSON(name)
    
//     if (json.length == 0) return false;

//     const index = json.findIndex(userObject => {
//         const userKey = Object.keys(userObject)[0]
//         return userObject[userKey] == userId
//     })

//     if (index === -1) return false

//     json.splice(index, 1)
//     await writeJSON(name, json)
// }


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

module.exports = { isValidURL, readJSON, writeJSON, findUserJSON, updateJSON, loadLanguageStrings, getUserPreferences, findUserJSON1, findIndexDataJson}