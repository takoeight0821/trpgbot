import _ from 'lodash';
import * as math from 'mathjs';
import { Messenger } from './Messenger';

export class DiceRoller {
    messenger: Messenger;
    constructor(messenger: Messenger) {
        this.messenger = messenger;
    }

    roll_nDn(count: number, roll: number) {
        const dices = diceRoll(count, roll);
        this.messenger.push(`[${dices}]`);
        this.messenger.trim();
        this.messenger.push(` = ${dices.reduce((a, b) => a + b, 0)}\n`);
        return dices.reduce((a, b) => a + b, 0);
    }

    roll_nBn(count: number, roll: number, mode: string, limit: number) {
        const dices = diceRoll(count, roll);

        this.messenger.push(`[${dices}]`);
        this.messenger.trim();

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
                return result;
        }
        this.messenger.push(` = ${result}\n`);
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

        this.messenger.push(`[${dices}]`);
        this.messenger.trim();
        this.messenger.push(` = ${score}\n`);
        return score;
    }

    // contentをパースし、フォーマットに従ってダイスロールを試みる。
    // 失敗した場合、falseを返す。
    roll(content: string) {
        const expr_char = '[0-9+-*/]';
        const digit = '[0-9]';
        const expr = `(?:${digit}+|\\(${expr_char}+\\))`;
        const nDn_re = new RegExp(`^(${expr})D(${expr})(\\+${expr}+)?`, 'i');
        const ndx_re = new RegExp(`^(${expr})DX(@${expr})?(\\+${expr}+)?`, 'i');
        const nBn_re = new RegExp(`^(${expr})B(${expr})(?:(>=|<=|>|<)(${expr}))?`)
        // const nDn_re = /^(\d+|\(.+\))D(\d+|\(.+\))(\+.+)?/i;
        // const ndx_re = /^(\d+|\(.+\))DX(@\d+|\(.+\))?(\+.+)?/i;
        // const nBn_re = /^(\d+|\(.+\))B(\d+|\(.+\))(?:(>=|<=|>|<)(\d+|\(.+\)))?/i;
        const D66_re = /^D66/;

        const nDn = nDn_re.exec(content);
        if (nDn !== null) {
            this.messenger.push("roll " + nDn[0] + '\n');
            this.calcCorrection(this.roll_nDn(math.eval(nDn[1]), math.eval(nDn[2])), nDn[3]);
            return true;
        }

        const ndx = ndx_re.exec(content);
        if (ndx !== null) {
            this.messenger.push("roll " + ndx[0] + '\n');
            this.calcCorrection(this.roll_dx(math.eval(ndx[1]), (ndx[2] === undefined) ? 10 : math.eval(ndx[2].slice(1))), ndx[3]);
            return true;
        }

        const nBn = nBn_re.exec(content);
        if (nBn !== null) {
            this.messenger.push("roll " + nBn[0] + '\n');
            this.roll_nBn(math.eval(nBn[1]), math.eval(nBn[2]), nBn[3], math.eval(nBn[4]));
            return true;
        }

        if (D66_re.test(content)) {
            this.messenger.push("roll D66 \n");
            this.roll_nDn(2, 6);
            return true;
        }

        return false;
    }

    calcCorrection(result: number, correction: string | undefined) {
        if (correction !== undefined) {
            try {
                const val = math.eval(correction.slice(1));
                this.messenger.push(`${result} + ${val} = ${result + val}`);
            } catch (error) {
                console.log("calcCorrection: " + String(error));
                this.messenger.push(`フォーマットが違います: ${correction}`);
            }
        }
    }
}

const diceRoll = (count: number, roll: number) => new Array(count).fill(0).map(() => _.random(1, roll));
