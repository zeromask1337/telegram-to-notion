import dotenv from "dotenv";
dotenv.config();

// Notion API
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });

// Telegraf API
import { Bot } from "grammy";
const bot = new Bot(process.env.BOT_TOKEN);

const notionPush = async (postText, postURL) => {
    const blockId = process.env.BLOCK_ID;
    const response = await notion.blocks.children.append({
        block_id: blockId,
        children: [
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    text: [
                        {
                            type: "text",
                            text: {
                                content: postText,
                                link: {
                                    url: postURL,
                                },
                            },
                        },
                    ],
                },
            },
        ],
    });
    console.log(response);
};

bot.api.setMyCommands([{ command: "start", description: "Starts the bot" }]);

bot.command("start", (ctx) => {
    // Returns chat info
    console.log(`Incoming chat`, ctx.chat);
});

bot.on("message::url", async (ctx) => {
    // Security shell. Kinda white list
    // Add chat id of your account or group
    if (
        ctx.chat.id === +process.env.CHAT_ID_1 ||
        ctx.chat.id === +process.env.CHAT_ID_2
    ) {
        const urlFilter =
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

        const links = [
            ctx.msg?.text,
            ctx.msg?.entities,
            ctx.msg?.caption,
            ctx.msg?.caption_entities,
        ];

        // console.log(links); // Debug log

        const [text, entities, caption, captionEntities] = links;

        console.log(ctx.msg);

        if (text) {
            const link = await text.match(urlFilter);
            if (link) {
                await notionPush(text, link[0]);
                console.log("Pushed text");
            } else {
                return 0;
            }
            if (entities) {
                for (let entity of entities) {
                    if (entity?.url) {
                        await notionPush(entity.url, entity.url);
                        console.log("Pushed entities");
                    } else {
                        return 0;
                    }
                }
            } else {
                return 0;
            }
        } else if (caption) {
            const link = await caption.match(urlFilter);
            if (link) {
                await notionPush(caption, link[0]);
                console.log("Pushed caption");
            } else {
                return 0;
            }
            if (captionEntities) {
                for (let entity of captionEntities) {
                    if (entity?.url) {
                        await notionPush(entity.url, entity.url);
                        console.log("Pushed caption entities");
                    } else {
                        return 0;
                    }
                }
            } else {
                return 0;
            }
        } else {
            return "Unknown msg structure";
        }
    } else {
        await ctx.reply("Authentication failed...");
    }
});

bot.start(console.log("Bot started..."));
