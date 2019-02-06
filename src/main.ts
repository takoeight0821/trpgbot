import 'source-map-support/register';
import Discord = require('discord.js');
import readline from 'readline';
import { DiceRoller } from './DiceRoller';
import math from 'mathjs';

var config = require('./config');

const client = new Discord.Client();

let env = {
    otaku: false
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', (msg: Discord.Message) => {
    if (msg.author.bot) {
        return;
    }

    let dr = new DiceRoller(msg);
    if (dr.roll()) {
        console.log("DICE ROLL");
        dr.sendText();
    }
    
    const compute_re = /^compute:(.+)$/i;
    const compute = compute_re.exec(msg.content);
    if (compute !== null) {
        dr.addText(compute[0]);
        try {
            dr.addText(`${compute[1]} = ${math.eval(compute[1])}`);
        } catch (error) {
            console.log("compute error: " + String(error));
            dr.addText(`フォーマットが違います: ${compute[1]}`);
        }
        console.log("COMPUTE " + compute[0]);
        dr.sendText();
    } 

    const haibokusya = /..者/;
    const result = haibokusya.exec(msg.content);
    if (env.otaku && result !== null) {
        console.log("ハァハァ");
        msg.channel.send(`ハァ…ハァ… ${result[0]}……？`);
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

rl.on('line', (input) => {
    if (input === "!toggle_otaku") {
        env.otaku = !env.otaku;
        console.log(`env.otaku = ${env.otaku}`);
    }
});