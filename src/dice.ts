import _ from "lodash";
import * as math from "mathjs";

const diceRoll = (count: number, faces: number) => new Array(count).fill(0).map(() => _.random(1, faces));

function toNumber(x: string): number {
    const y = math.eval(x);
    if (typeof y === "number") {
        return y;
    }

    throw new Error(`Expected number, but got ${y}`);
}

export function execute(q: Query): Result {
    return q.roll(q.params);
}

export function parse(content: string): NdnQuery | DxQuery | NbnQuery | NotDiceRoll {
    const exprChar = "[0-9+\\-*/]";
    const digit = "[0-9]";
    const expr = `(?:${digit}+|\\(${exprChar}+\\))`;
    const nDnRe = new RegExp(`(${expr})D(${expr})(\\+${expr}+)?(?:(>=|<=|>|<)(${expr}))?`, "i");
    const ndxRe = new RegExp(`(${expr})DX(@${expr})?(\\+${expr}+)?(?:(>=|<=|>|<)(${expr}))?`, "i");
    const nBnRe = new RegExp(`(${expr})B(${expr})(?:(>=|<=|>|<)(${expr}))?`, "i");
    const D66Re = /D66/;

    const nDn = nDnRe.exec(content);
    if (nDn !== null) {
        return {
            tag: "ndn",
            params: {
                correction: nDn[3] !== undefined ? toNumber(nDn[3]) : undefined,
                count: toNumber(nDn[1]),
                faces: toNumber(nDn[2]),
                limit: nDn[5] !== undefined ? toNumber(nDn[5]) : undefined,
                mode: convertToMode(nDn[4]),
            },
            roll: ndnRoll,
        };
    }

    const ndx = ndxRe.exec(content);
    if (ndx !== null) {
        return {
            tag: "ndx",
            params: {
                correction: ndx[3] !== undefined ? toNumber(ndx[3]) : undefined,
                count: toNumber(ndx[1]),
                critical: ndx[2] !== undefined ? toNumber(ndx[2].slice(1)) : 10,
                limit: ndx[5] !== undefined ? toNumber(ndx[5]) : undefined,
                mode: convertToMode(ndx[4]),
            },
            roll: dxRoll,
        };
    }

    const nBn = nBnRe.exec(content);
    if (nBn !== null) {
        return {
            tag: "nbn",
            params: {
                count: toNumber(nBn[1]),
                faces: toNumber(nBn[2]),
                limit: nBn[4] !== undefined ? toNumber(nBn[4]) : undefined,
                mode: convertToMode(nBn[3]),
            },
            roll: nbnRoll,
        };
    }

    if (D66Re.test(content)) {
        return {
            tag: "ndn",
            params: {
                count: 2,
                faces: 6,
                mode: "normal",
            },
            roll: ndnRoll,
        };
    }

    return "not dice roll";
}

function convertToMode(mode: string | undefined): Mode {
    if (mode === undefined) {
        return "normal";
    }

    if (isMode(mode)) {
        return mode;
    } else {
        return "normal";
    }

}

function isMode(mode: string): mode is Mode {
    switch (mode) {
        case ">": return true;
        case ">=": return true;
        case "<": return true;
        case "<=": return true;
        default: return false;
    }
}

function ndnRoll(p: NdnQuery['params']): NdnResult {
    const dices = diceRoll(p.count, p.faces);
    let result: NdnResult = { tag: "ndn", input: `${p.count}D${p.faces}`, dices, score: dices.reduce((a, b) => a + b, 0)} ;
    if (p.correction) {
        result.score += p.correction;
    }
    if (p.mode !== "normal" && p.limit) {
        result.isSuccess = judge(result, p.mode, p.limit);
    }
    return result;
}

function nbnRoll(p: NbnQuery['params']): NbnResult {
    const dices = diceRoll(p.count, p.faces);
    const result: NbnResult = { tag: "nbn", input: `${p.count}B${p.faces}`, dices };
    if (p.limit) {
        const limit = p.limit;
        switch (p.mode) {
            case ">": return Object.assign(result, { score: dices.filter((a) => a > limit).length });
            case ">=": return Object.assign(result, { score: dices.filter((a) => a >= limit).length });
            case "<": return Object.assign(result, { score: dices.filter((a) => a < limit).length });
            case "<=": return Object.assign(result, { score: dices.filter((a) => a <= limit).length });
        }
    }
    return result;
}

function dxRoll(p: DxQuery['params']): DxResult {
    let tmp = diceRoll(p.count, 10);
    const dices = [tmp];
    let score = (Math.max(...tmp) >= p.critical) ? 10 : Math.max(...tmp);

    while (tmp.some((a) => a >= p.critical)) {
        tmp = diceRoll(tmp.filter((a) => a >= p.critical).length, 10);
        dices.push(tmp);
        score += (Math.max(...tmp) >= p.critical) ? 10 : Math.max(...tmp);
    }

    let result: DxResult = { tag: "dx", input: `${p.count}dx@${p.critical}`, dices, score };
    if (p.correction) {
        result.score += p.correction;
    }
    if (p.mode !== "normal" && p.limit) {
        result.isSuccess = judge(result, p.mode, p.limit);
    }

    return result;
}

function judge(result: { score: number }, mode: Mode, limit: number): boolean {
    switch (mode) {
        case ">": return result.score > limit;
        case ">=": return result.score >= limit;
        case "<": return result.score < limit;
        case "<=": return result.score <= limit;
        case "normal": return true;
    }
}

function isNdnResult(result: Result): result is NdnResult {
    return result.tag === "ndn";
}

function isNbnResult(result: Result): result is NbnResult {
    return result.tag === "nbn";
}

function isDxResult(result: Result): result is DxResult {
    return result.tag === "dx";
}

export function prettyResult(result: Result): string {
    let message = `roll: ${result.input}\n`;
    message += `${JSON.stringify(result.dices, null, 2).slice(0, 100)}\n`
    if (result.score) {
        message += `score: ${result.score}`;
    }
    if (!isNbnResult(result) && result.isSuccess !== undefined) {
        message += ` ${result.isSuccess ? "成功" : "失敗"}\n`;
    } else {
        message += "\n";
    }
    return message;
}