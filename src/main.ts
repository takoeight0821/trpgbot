import 'source-map-support/register';
import Discord = require('discord.js');
import readline from 'readline';
import { DiceRoller } from './DiceRoller';
import math from 'mathjs';
import { Messenger } from './Messenger';
import kuromoji from 'kuromoji';

var config = require('./config');

const client = new Discord.Client();

let env = {
    otaku: false
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let builder = kuromoji.builder({
    dicPath: 'node_modules/kuromoji/dict'
});
let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>;
builder.build((err, _tokenizer) => {
    if (err) {
        console.error(`${err}`);
    } else {
        tokenizer = _tokenizer;
    }
});

client.on('message', (msg: Discord.Message) => {
    if (msg.author.bot) {
        return;
    }

    let messenger = new Messenger(msg.channel);

    // ダイスロール
    let dr = new DiceRoller(messenger);
    if (dr.roll(msg.content)) {
        console.log("DICE ROLL");
    }

    // 計算
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

    // 敗北者
    const haibokusya = /者$/;
    if (env.otaku) {
        let tokens = tokenizer.tokenize(msg.content);

        let sya_index = tokens.findIndex(e => { return e.surface_form === "者" });
        let syas = tokens.filter(e => haibokusya.test(e.surface_form));

        if (sya_index > 0) {
            if (tokens[sya_index - 1].pos === '名詞') {
                console.log(`ハァハァ ${tokens[sya_index - 1].surface_form}`);
                messenger.push(`ハァハァ…ハァハァ… ${tokens[sya_index - 1].surface_form}者……？\n`);
            }
        } else if (syas.length >= 1) {
            console.log(`ハァハァ ${syas[0].surface_form}`);
            messenger.push(`ハァハァ…ハァハァ… ${syas[0].surface_form}……？\n`);
        }
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