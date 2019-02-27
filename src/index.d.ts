interface NdnResult {
    tag: "ndn",
    input: string;
    dices: number[];
    score: number;
    isSuccess?: boolean;
}

interface NbnResult {
    tag: "nbn",
    input: string;
    dices: number[];
    score?: number;
}

type Mode = ">" | ">=" | "<" | "<=" | "normal";

interface DxResult {
    tag: "dx",
    input: string;
    dices: number[][];
    score: number;
    isSuccess?: boolean;
}

type Result = NdnResult | NbnResult | DxResult;

interface Query {
    tag: string,
    params: any,
    roll: (x: Query['params']) => Result
}

interface NdnQuery extends Query {
    tag: "ndn",
    params: {
        count: number;
        faces: number;
        correction?: number;
        mode: Mode;
        limit?: number;
    },
    roll: (x: NdnQuery['params']) => NdnResult
}

interface DxQuery extends Query {
    tag: "ndx",
    params: {
        count: number;
        critical: number;
        correction?: number;
        mode: Mode;
        limit?: number;
    },
    roll: (x: DxQuery['params']) => DxResult
}

interface NbnQuery extends Query {
    tag: "nbn",
    params: {
        count: number;
        faces: number;
        mode: Mode;
        limit?: number;
    },
    roll: (x: NbnQuery['params']) => NbnResult
}

type NotDiceRoll = "not dice roll"