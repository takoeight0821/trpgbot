import _ from "lodash";
import * as math from "mathjs";
import { Messenger } from "./Messenger";

export class DiceRoller {
    public messenger: Messenger;
    constructor(messenger: Messenger) {
        this.messenger = messenger;
    }

    public roll_nDn(count: number, roll: number) {
        const dices = diceRoll(count, roll);
        this.messenger.push(`[${dices}]`);
        this.messenger.trim();
        this.messenger.push(` = ${dices.reduce((a, b) => a + b, 0)}; `);
        return dices.reduce((a, b) => a + b, 0);
    }

    public roll_nBn(count: number, roll: number, mode: string | undefined, limit: number) {
        const dices = diceRoll(count, roll);

        this.messenger.push(`[${dices}]`);
        this.messenger.trim();

        let result = 0;
        switch (mode) {
            case ">=":
                result = dices.filter((a) => a >= limit).length;
                break;
            case "<=":
                result = dices.filter((a) => a <= limit).length;
                break;
            case ">":
                result = dices.filter((a) => a > limit).length;
                break;
            case "<":
                result = dices.filter((a) => a < limit).length;
                break;
            default:
                return result;
        }
        this.messenger.push(` = ${result}; `);
        return result;
    }

    public roll_dx(count: number, critical: number) {
        let tmp = diceRoll(count, 10);
        let dices = `[${tmp}]`;
        let score = (Math.max(...tmp) >= critical) ? 10 : Math.max(...tmp);

        while (tmp.some((a) => a >= critical)) {
            tmp = diceRoll(tmp.filter((a) => a >= critical).length, 10);
            dices = dices.concat(", ", `[${tmp}]`);
            score += (Math.max(...tmp) >= critical) ? 10 : Math.max(...tmp);
        }

        this.messenger.push(`[${dices}]`);
        this.messenger.trim();
        this.messenger.push(` = ${score}; `);
        return score;
    }

    // contentをパースし、フォーマットに従ってダイスロールを試みる。
    // 達成値か判定の成否を返す。
    // 失敗した場合、undefinedを返す。
    public roll(content: string): boolean | number | undefined {
        const exprChar = "[0-9+\\-*/]";
        const digit = "[0-9]";
        const expr = `(?:${digit}+|\\(${exprChar}+\\))`;
        const nDnRe = new RegExp(`^(${expr})D(${expr})(\\+${expr}+)?(?:(>=|<=|>|<)(${expr}))?`, "i");
        const ndxRe = new RegExp(`^(${expr})DX(@${expr})?(\\+${expr}+)?(?:(>=|<=|>|<)(${expr}))?`, "i");
        const nBnRe = new RegExp(`^(${expr})B(${expr})(?:(>=|<=|>|<)(${expr}))?`, "i");
        const D66Re = /^D66/;

        const nDn = nDnRe.exec(content);
        if (nDn !== null) {
            const count = math.eval(nDn[1]);
            const roll = math.eval(nDn[2]);
            const correction = nDn[3] !== undefined ? math.eval(nDn[3]) : 0;
            const mode: string | undefined = nDn[4];
            const limit = nDn[5] !== undefined ? math.eval(nDn[5]) : 0;

            this.messenger.push(
                `roll ${count}D${roll}+${correction}${mode !== undefined ? mode + String(limit) : ""}\n`);

            const val = this.calcCorrection(this.roll_nDn(count, roll), correction);
            if (val !== undefined && mode !== undefined) {
                return this.judge(val, mode, limit);
            }

            return val;
        }

        const ndx = ndxRe.exec(content);
        if (ndx !== null) {
            const count = math.eval(ndx[1]);
            const critical = ndx[2] !== undefined ? math.eval(ndx[2].slice(1)) : 10;
            const correction = ndx[3] !== undefined ? math.eval(ndx[3]) : 0;
            const mode: string | undefined = ndx[4];
            const limit = ndx[5] !== undefined ? math.eval(ndx[5]) : 0;

            this.messenger.push(
                `roll ${count}DX@${critical}+${correction}${mode !== undefined ? mode + String(limit) : ""}\n`);

            const val = this.calcCorrection(this.roll_dx(count, critical), correction);
            if (val !== undefined && mode !== undefined) {
                return this.judge(val, mode, limit);
            }

            return val;
        }

        const nBn = nBnRe.exec(content);
        if (nBn !== null) {
            const count = math.eval(nBn[1]);
            const roll = math.eval(nBn[2]);
            const mode: string | undefined = nBn[3];
            const limit = nBn[4] !== undefined ? math.eval(nBn[4]) : 0;

            this.messenger.push(`roll ${count}B${roll}${mode !== undefined ? mode + String(limit) : ""}\n`);

            return this.roll_nBn(count, roll, mode, limit);
        }

        if (D66Re.test(content)) {
            this.messenger.push("roll D66 \n");
            return this.roll_nDn(2, 6);
        }

        return undefined;
    }

    public judge(val: number, mode: string, limit: number): boolean | undefined {
        switch (mode) {
            case ">=":
                if (val >= limit) {
                    this.messenger.push("成功");
                    return true;
                } else {
                    this.messenger.push("失敗");
                    return false;
                }
            case "<=":
                if (val <= limit) {
                    this.messenger.push("成功");
                    return true;
                } else {
                    this.messenger.push("失敗");
                    return false;
                }
            case ">":
                if (val > limit) {
                    this.messenger.push("成功");
                    return true;
                } else {
                    this.messenger.push("失敗");
                    return false;
                }
            case "<":
                if (val < limit) {
                    this.messenger.push("成功");
                    return true;
                } else {
                    this.messenger.push("失敗");
                    return false;
                }
            default:
                break;
        }
    }

    public calcCorrection(result: number, correction: number): number | undefined {
        try {
            this.messenger.push(`${result} + ${correction} = ${result + correction} ;`);
            return result + correction;
        } catch (error) {
            console.log("calcCorrection: " + String(error));
            this.messenger.push(`フォーマットが違います: ${correction}; `);
        }
    }
}

const diceRoll = (count: number, roll: number) => new Array(count).fill(0).map(() => _.random(1, roll));
