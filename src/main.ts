import 'source-map-support/register';
import Discord = require('discord.js');
import readline from 'readline';
import { DiceRoller } from './DiceRoller';
import math from 'mathjs';
import { Messenger } from './Messenger';

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

    let messenger = new Messenger(msg.channel);

    let dr = new DiceRoller(messenger);
    if (dr.roll(msg.content)) {
        console.log("DICE ROLL");
    }

    const compute_re = /^compute:(.+)$/i;
    const compute = compute_re.exec(msg.content);
    if (compute !== null) {
        messenger.push(compute[0] + '\n');
        try {
            messenger.push(`${compute[1]} = ${math.eval(compute[1])}\n`);
        } catch (error) {
            console.log("compute error: " + String(error));
            messenger.push(`フォーマットが違います: ${compute[1]}\n`);
        }
        console.log("COMPUTE " + compute[0]);
    }

    const haibokusya = /..者/;
    const result = haibokusya.exec(msg.content);
    if (env.otaku && result !== null) {
        console.log("ハァハァ");
        messenger.push(`ハァ…ハァ… ${result[0]}……？\n`);
    }

    messenger.send();
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