import Discord from "discord.js";
import kuromoji from "kuromoji";
import math from "mathjs";
import "source-map-support/register";
import { DiceRoller } from "./DiceRoller";
import { Messenger } from "./Messenger";
import * as Dice from "./dice";

const client = new Discord.Client();

const env = {
    otaku: true,
    prefix: "!",
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

            const syaIndex = tokens.findIndex((e) => e.surface_form === "者");
            const syas = tokens.filter((e) => haibokusya.test(e.surface_form));

            console.log(`parsed: ${JSON.stringify(tokens, null, 2)}`);

            if (syaIndex > 0) {
                if (tokens[syaIndex - 1].pos === "名詞") {
                    console.log(`ハァハァ ${tokens[syaIndex - 1].surface_form}`);
                    messenger.push(`ハァ…ハァ… ${tokens[syaIndex - 1].surface_form}者……？\n`);
                }
            } else if (syas.length >= 1) {
                console.log(`ハァハァ ${syas[0].surface_form}`);
                messenger.push(`ハァ…ハァ… ${syas[0].surface_form}……？\n`);
            }
        }

        // これどうするかちゃんと考えんとアカンね。
        // コンソールをちゃんと作ろうか…
        if (msg.content === "!toggle_otaku") {
            env.otaku = !env.otaku;
            console.log(`env.otaku = ${env.otaku}\n`);
            messenger.push(`env.otaku = ${env.otaku}\n`);
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
