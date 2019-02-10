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

    roll_nBn(count: number, roll: number, mode: string | undefined, limit: number) {
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
        const expr_char = '[0-9+\\-*/]';
        const digit = '[0-9]';
        const expr = `(?:${digit}+|\\(${expr_char}+\\))`;
        const nDn_re = new RegExp(`^(${expr})D(${expr})(\\+${expr}+)?(?:(>=|<=|>|<)(${expr}))?`, 'i');
        const ndx_re = new RegExp(`^(${expr})DX(@${expr})?(\\+${expr}+)?(?:(>=|<=|>|<)(${expr}))?`, 'i');
        const nBn_re = new RegExp(`^(${expr})B(${expr})(?:(>=|<=|>|<)(${expr}))?`, 'i');
        const D66_re = /^D66/;

        const nDn = nDn_re.exec(content);
        if (nDn !== null) {
            let count = math.eval(nDn[1]);
            let roll = math.eval(nDn[2]);
            let correction = nDn[3] !== undefined ? math.eval(nDn[3]) : 0;
            let mode: string | undefined = nDn[4];
            let limit = nDn[5] !== undefined ? math.eval(nDn[5]) : 0;

            this.messenger.push(`roll ${count}D${roll}+${correction}${mode !== undefined ? mode + String(limit) : ""}\n`);

            let val = this.calcCorrection(this.roll_nDn(count, roll), correction);
            if (val !== undefined && mode !== undefined) {
                this.judge(val, mode, limit);
            }

            return true;
        }

        const ndx = ndx_re.exec(content);
        if (ndx !== null) {
            let count = math.eval(ndx[1]);
            let critical = ndx[2] !== undefined ? math.eval(ndx[2].slice(1)) : 10;
            let correction = ndx[3] !== undefined ? math.eval(ndx[3]) : 0;
            let mode : string | undefined = ndx[4];
            let limit = ndx[5] !== undefined ? math.eval(ndx[5]) : 0;

            this.messenger.push(`roll ${count}DX@${critical}+${correction}${mode !== undefined ? mode + String(limit) : ""}\n`);

            let val = this.calcCorrection(this.roll_dx(count, critical), correction);
            if (val !== undefined && mode !== undefined) {
                this.judge(val, mode, limit);
            }

            return true;
        }

        const nBn = nBn_re.exec(content);
        if (nBn !== null) {
            let count = math.eval(nBn[1]);
            let roll = math.eval(nBn[2]);
            let mode : string | undefined = nBn[3];
            let limit = nBn[4] !== undefined ? math.eval(nBn[4]) : 0;

            this.messenger.push(`roll ${count}B${roll}${mode !== undefined ? mode + String(limit) : ""}\n`);

            this.roll_nBn(count, roll, mode, limit);

            return true;
        }

        if (D66_re.test(content)) {
            this.messenger.push("roll D66 \n");
            this.roll_nDn(2, 6);
            return true;
        }

        return false;
    }

    judge(val: number, mode: string, limit: number) {
        switch (mode) {
            case ">=":
                if (val >= limit) {
                    this.messenger.push("成功");
                } else {
                    this.messenger.push("失敗");
                }
                break;
            case "<=":
                if (val <= limit) {
                    this.messenger.push("成功");
                } else {
                    this.messenger.push("失敗");
                }
                break;
            case ">":
                if (val > limit) {
                    this.messenger.push("成功");
                } else {
                    this.messenger.push("失敗");
                }
                break;
            case "<":
                if (val < limit) {
                    this.messenger.push("成功");
                } else {
                    this.messenger.push("失敗");
                }
                break;
            default:
                break;
        }
    }

    calcCorrection(result: number, correction: number): number | undefined {
        try {
            this.messenger.push(`${result} + ${correction} = ${result + correction}`);
            return result + correction;
        } catch (error) {
            console.log("calcCorrection: " + String(error));
            this.messenger.push(`フォーマットが違います: ${correction}`);
        }
    }
}

const diceRoll = (count: number, roll: number) => new Array(count).fill(0).map(() => _.random(1, roll));
