const fs = require('fs').promises
const validator =  require('validator')

const isValidURL = url => {
    return validator.isURL(url)
}

const readJSON = async () => {
    try {
      const data = await fs.readFile('./data.json', 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to read JSON file:', error.message)
      return []
    }
}

const writeJSON = async (obj) => {
    try {
        const cData = await readJSON()
        cData.push(obj)
        const jsonString = JSON.stringify(cData, null, 2)
        await fs.writeFile('./data.json', jsonString, 'utf-8')
    } catch (error) {
        console.error('Failed to write JSON file:', error.message)
    }
}

const findUserJSON = async (userId) => {
    const json = await readJSON()
    const userFound = json.find(user => user.id === userId)
    return userFound
}

module.exports = { isValidURL, readJSON, writeJSON, findUserJSON }