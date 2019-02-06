import Discord = require('discord.js');
import { getRandomInt } from './Utils';
import * as math from 'mathjs';

export class DiceRoller {
    msg: Discord.Message;
    text: string;
    channel: Discord.Channel;
    constructor(msg: Discord.Message) {
        this.msg = msg;
        this.text = "";
        this.channel = msg.channel;
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
            console.log("--- SEND start ---");
            this.msg.channel.send(this.text);

            if (this.msg.channel instanceof Discord.DMChannel) {
                console.log(this.msg.author.username + this.text);
            } else if (this.msg.channel instanceof Discord.GroupDMChannel) {
                console.log(this.msg.channel.name + this.text);
            } else {
                console.log(this.msg.channel.guild.name + this.text);
            }

            console.log("--- SEND end ---");
        }
    }

    roll_nDn(count: number, roll: number) {
        const dices = diceRoll(count, roll);
        this.addText(`[${dices}`);
        this.trimText();
        this.addText(`${dices.reduce((a, b) => a + b, 0)}`, "] = ");
        return dices.reduce((a, b) => a + b, 0);
    }

    roll_nBn(count: number, roll: number, mode: string, limit: number) {
        const dices = diceRoll(count, roll);

        this.addText(`[${dices}`);
        this.trimText();

        let result = 0;
        switch (mode) {
            case ">=":
                result = dices.filter(a => a >= limit).length;
                break;
            case "<=":
                result = dices.filter(a => a <= limit).length;
                break;
            case ">":
                result = dices.filter(a => a > limit).length;
                break;
            case "<":
                result = dices.filter(a => a < limit).length;
                break;
            default:
                this.addText("]", "");
                return result;
        }
        this.addText(`${result}`, "] = ");
        return result;
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
        const nDn_re = /^(\d+)D(\d+)(\+.+)?$/i;
        const ndx_re = /^(\d+)DX(@\d+)?(\+.+)?$/i;
        const nBn_re = /^(\d+)B(\d+)(?:(>=|<=|>|<)(\d+))?$/i;
        const D66_re = /^D66$/;

        const nDn = nDn_re.exec(this.msg.content);
        const ndx = ndx_re.exec(this.msg.content);
        const nBn = nBn_re.exec(this.msg.content);

        if (nDn !== null) {
            this.addText("roll " + nDn[0]);
            this.calcCorrection(this.roll_nDn(Number(nDn[1]), Number(nDn[2])), nDn[3]);
            return true;
        } else if (ndx !== null) {
            this.addText("roll " + ndx[0]);
            this.calcCorrection(this.roll_dx(Number(ndx[1]), (ndx[2] === undefined) ? 10 : Number(ndx[2].slice(1))), ndx[3]);
            return true;
        } else if (nBn !== null) {
            this.addText("roll " + nBn[0]);
            this.roll_nBn(Number(nBn[1]), Number(nBn[2]), nBn[3], Number(nBn[4]));
            return true;
        } else if (D66_re.test(this.msg.content)) {
            this.addText("roll D66");
            this.roll_nDn(2, 6);
            return true;
        } else {
            return false;
        }
    }

    calcCorrection(result: number, correction: string | undefined) {
        if (correction !== undefined) {
            try {
                const val = math.eval(correction.slice(1));
                this.addText(`${result} + ${val} = ${result + val}`);
            } catch (error) {
                console.log("calcCorrection: " + String(error));
                this.addText(`フォーマットが違います: ${correction}`);
            }
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
