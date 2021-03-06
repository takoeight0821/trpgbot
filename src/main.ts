import Discord from "discord.js";
import kuromoji from "kuromoji";
import math from "mathjs";
import "source-map-support/register";
import _ from "lodash";
import { Messenger } from "./Messenger";
import * as Dice from "./dice";

const client = new Discord.Client();

const MAX_TIMES = 1000000;

const env = {
    otaku: true,
    prefix: "!",
    times: 10000,
};

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const builder = kuromoji.builder({
    dicPath: "node_modules/kuromoji/dict",
});
let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>;
builder.build((err, t) => {
    if (err) {
        console.error(`${err}`);
    } else {
        tokenizer = t;
    }
});

client.on("message", (msg) => {
    if (msg.author.bot) {
        return;
    }

    const messenger = new Messenger(msg.channel);

    try {
        // ダイスロール(確率計算)
        const probRe = /^!prob (.+)/i;
        const prob = probRe.exec(msg.content);
        if (prob) {
            messenger.push(`compute probability: ${prob[1]}\n`);
            const query = Dice.parse(prob[1]);
            if (query !== "not dice roll" && query.tag !== "nbn") {
                const success = _.times(env.times, _ => Dice.execute(query))
                    .filter(t => t.tag !== "nbn" && t.isSuccess)
                    .length;
                messenger.push(`${success}/${env.times} およそ${success / env.times * 100}%\n`);
            } else {
                messenger.push(`フォーマットが違います: ${prob[1]}\n`);
            }
        }

        // ダイスロール
        const query = Dice.parse(msg.content);
        if (query !== "not dice roll") {
            messenger.push(Dice.prettyResult(Dice.execute(query)));
            console.log(`DICE ROLL: ${JSON.stringify(query, null, 2)}`)
        }

        // 計算
        const computeRe = /^C\((.+)\)/i;
        const compute = computeRe.exec(msg.content);
        if (compute !== null) {
            messenger.push("compute: " + compute[0] + "\n");
            try {
                messenger.push(`${compute[1]} = ${math.eval(compute[1])}\n`);
            } catch (error) {
                console.log("compute error: " + String(error));
                messenger.push(`フォーマットが違います: ${compute[1]}\n`);
            }
            console.log("COMPUTE " + compute[0]);
        }

        // 敗北者
        const haibokusya = /.者$/;
        if (env.otaku) {
            const tokens = tokenizer.tokenize(msg.content);

            const syaIndex = tokens.findIndex(e => /者$/.test(e.surface_form));
            const syas = tokens.filter((e) => haibokusya.test(e.surface_form));

            console.log(`parsed: ${JSON.stringify(tokens, null, 2)}`);

            if (syaIndex >= 0) {
                let meishis = _.takeRightWhile(_.take(tokens, syaIndex + 1), token => token.pos === "名詞" || token.surface_form === "者");
                if (meishis.length > 0 && !(meishis.length === 1 && meishis[0].surface_form === "者")) {
                    console.log(`ハァハァ ${meishis}`);
                    messenger.push(`ハァ…ハァ… ${meishis.map(m => m.surface_form).join('')}……？\n`)
                }
            }
        }

        // これどうするかちゃんと考えんとアカンね。
        // コンソールをちゃんと作ろうか…
        if (msg.content === "!toggle_otaku") {
            env.otaku = !env.otaku;
            console.log(`env.otaku = ${env.otaku}\n`);
            messenger.push(`env.otaku = ${env.otaku}\n`);
        }

        const changeTimesRe = /^!change_times (\d+)/i;
        const changeTimes = changeTimesRe.exec(msg.content);
        if (changeTimes) {
            env.times = Math.min(parseInt(changeTimes[1]), MAX_TIMES);
            messenger.push(`env.times = ${env.times}\n`);
        }

        messenger.send();
    } catch (e) {
        console.error(`error on ${msg.content}: ${JSON.stringify(e, null, 2)}`);
        messenger.push(`メッセージ処理中になんか踏んで死んだ\n`);
        messenger.send();
    }
});

client.login(process.env.BOT_TOKEN);

process.on("SIGINT", (_) => {
    client.destroy();
});

process.on("SIGTERM", (_) => {
    client.destroy();
});

process.on("SIGHUP", (_) => {
    client.destroy();
});
