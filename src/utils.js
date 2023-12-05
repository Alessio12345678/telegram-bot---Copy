const fs = require('fs')

const isValidURL = url => {
    const pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})' + // domain name
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$','i'  // fragment locator
    )

    return !! pattern.test(url)
}

const readJSON = () => {
    return fetch('./data.json')
        .then((response) => {
            if (!response.ok) 
                throw new Error(`Failed to fetch JSON file: ${response.status}`)
            return response.json()
        })
        .catch((error) => console.error(error))
}

const writeJSON = (obj) => {
    const jsonString = JSON.stringify(obj, null, 2)
    fs.writeFile('./data.json', jsonString, 'utf-8', error => {
        if (error)
            console.error(error)
    })
}

const findUserJSON = (userId) => {
    const json = readJSON()
    const userFound = json.find(user => user.id === userId)
    return userFound
}

module.exports = { isValidURL, readJSON, writeJSON, findUserJSON }