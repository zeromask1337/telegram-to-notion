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
        const links = [
            ctx.msg?.text,
            ctx.msg?.entities,
            ctx.msg?.caption,
            ctx.msg?.caption_entities,
        ];

        const [text, entities, caption, captionEntities] = links;

        console.log(ctx.msg);

        async function redirect(itemText, item) {
            for (let entity of item) {
                if (entity.type === "url") {
                    let link = itemText.substr(entity.offset, entity.length);
                    await notionPush(link, link);
                } else if (entity.type === "text_link") {
                    let link = itemText.substr(entity.offset, entity.length);
                    console.log(link);
                    await notionPush(link, entity.url);
                }
            }
        }

        if (entities) {
            await redirect(text, entities);
        } else if (captionEntities) {
            await redirect(caption, captionEntities);
        } else {
            return "Unknown msg structure";
        }
    } else {
        await ctx.reply("Authentication failed...");
    }
});

bot.start(console.log("Bot started..."));
