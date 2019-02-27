import Discord from "discord.js";

export class Messenger {
    private channel: Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel;
    private message: string = "";
    private maxLength: number = 1000;
    private isStopped: boolean = false;

    constructor(channel: Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel) {
        this.channel = channel;
    }

    public push(message: string) {
        if (!this.isStopped) {
            this.message = this.message.concat(message);
        }
    }

    public trim() {
        this.message = this.message.substr(0, this.maxLength);
        if (this.message.length >= this.maxLength) {
            this.push("...");
        }
    }

    public send() {
        if (this.message.length > 0) {
            console.log("--- SEND start ---");
            this.channel.send(this.message);

            if (this.channel instanceof Discord.DMChannel) {
                console.log(`to ${this.channel.recipient.username}\n${this.message}`);
            } else if (this.channel instanceof Discord.GroupDMChannel) {
                console.log(`to ${this.channel.name}\n${this.message}`);
            } else {
                console.log(`to ${this.channel.guild.name}\n${this.message}`);
            }
            console.log("--- SEND end ---");
        }
    }
}
