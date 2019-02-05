import Discord = require('discord.js');
import { getRandomInt } from './Utils';

export class DiceRoller {
    msg: Discord.Message;
    text: string;
    constructor(msg: Discord.Message) {
        this.msg = msg;
        this.text = "";
    }

    addText(text: string, sep = "\n") {
        this.text = this.text.concat(sep, text);
    }

    trimText(length = 1000) {
        this.text = this.text.substr(0, length);
        if (this.text.length >= length) {
            this.text += "...";
        }
    }

    sendText() {
        if (this.text.length > 0) {
            this.msg.channel.send(this.text);
        }
    }

    roll_nDn(count: number, roll: number) {
        const dices = diceRoll(count, roll);
        this.addText(`[${dices}`);
        this.trimText();
        this.addText(`${dices.reduce((a, b) => a + b)}`, "] = ");
        return dices.reduce((a, b) => a + b);
    }

    roll_dx(count: number, critical: number) {
        let tmp = diceRoll(count, 10);
        let dices = `[${tmp}]`
        let score = (Math.max(...tmp) >= critical) ? 10 : Math.max(...tmp);

        while (tmp.some(a => a >= critical)) {
            tmp = diceRoll(tmp.filter((a) => a >= critical).length, 10);
            dices = dices.concat(", ", `[${tmp}]`);
            score += (Math.max(...tmp) >= critical) ? 10 : Math.max(...tmp);
        }

        this.addText(`[${dices}`);
        this.trimText();
        this.addText(`${score}`, "] = ");
        return score;
    }

    // this.msg.contentをパースし、フォーマットに従ってダイスロールを試みる。
    // 失敗した場合、falseを返す。
    roll() {
        const nDn_re = /^(\d+)D(\d+)(\+\d+|\-\d+)?$/i;
        const ndx_re = /^(\d+)DX(@\d+)?(\+\d+|\-\d+)?$/i;
        const D66_re = /^D66$/;

        const nDn = nDn_re.exec(this.msg.content);
        const ndx = ndx_re.exec(this.msg.content)

        if (nDn !== null) {
            this.rollAndCalc(nDn[0], this.roll_nDn(Number(nDn[1]), Number(nDn[2])), nDn[3]);
            return true;
        } else if (ndx !== null) {
            this.rollAndCalc(ndx[0], this.roll_dx(Number(ndx[1]), (ndx[2] === undefined) ? 10 : Number(ndx[2].slice(1))), ndx[3]);
            return true;
        } else if (D66_re.test(this.msg.content)) {
            this.addText("roll D66");
            this.roll_nDn(2, 6);
            return true;
        } else {
            return false;
        }
    }

    rollAndCalc(matched: string, result: number, correction: string | undefined) {
        this.addText("roll " + matched);
        if (correction !== undefined) {
            this.addText(`${result} + ${Number(correction)} = ${result + Number(correction)}`);
        }
    }
}

function diceRoll(count: number, roll: number): number[] {
    let dices = [];
    for (let i = 0; i < count; i++) {
        dices.push(getRandomInt(1, roll + 1));
    }
    return dices;
}
