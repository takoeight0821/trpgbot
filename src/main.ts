import 'source-map-support/register';
import Discord = require('discord.js');
import readline from 'readline';
import { DiceRoller } from './DiceRoller';

var config = require('./config');

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg: Discord.Message) => {
    let dr = new DiceRoller(msg);
    if (dr.roll()) {
        console.log("DICE ROLL");
        dr.sendText();
    }
});

client.login(config.get('token'));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('close', () => {
    client.destroy();
    process.exit(0);
});