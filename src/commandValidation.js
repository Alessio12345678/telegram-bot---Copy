const isCommand = (text) => {
    return text[0] === '/'
}
const isExistingCommand = (commands) => {
    return commands.some((command) => {
        return command.command === msgText
    });
}

module.exports = [isCommand, isExistingCommand]
