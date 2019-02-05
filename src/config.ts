var convict = require('convict');

var config = convict({
    token: {
        doc: "The bot token.",
        format: String,
        arg: "token",
        default: null
    }
});

config.loadFile('./config.json');

config.validate({allowed: 'strict'});

module.exports = config;