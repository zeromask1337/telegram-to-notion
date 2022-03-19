import 'dotenv/config';

// Notion API
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });
// import type {PartialBlockObjectResponse} from "@notionhq/client/build/src/api-endpoints";

// Telegraf API
import { Bot } from "grammy";
import {
    ListBlockChildrenResponse
} from "@notionhq/client/build/src/api-endpoints";
const bot = new Bot(process.env.BOT_TOKEN);

function isTodo <T extends Record<string, unknown>>(obj: T): obj is T & { type: 'to_do' } {
    return 'type' in obj && obj.type === 'to_do';
}

// const test: ListBlockChildrenResponse = {};

function alreadyExists(link: string, list: ListBlockChildrenResponse) {
    for (const result of list.results) {
        if (isTodo(result)) {
            if (result.to_do.rich_text[0].href == link) {
                return true;
            }
        }
    }
};

// (async function (){
//     const blockId = process.env.BLOCK_ID;
//     const response = await notion.blocks.children.list({
//         block_id: blockId,
//         page_size: 50,
//     });
//     const link = "https://twitter.com/nat_davydova/status/1457796596540706831?s=20";
//     if (alreadyExists(link, response)) {
//         console.log("Test passed")
//     }
// })()


async function notionPush(postText, postURL) {
    const response = await notion.blocks.children.append({
        block_id: process.env.BLOCK_ID,
        children: [
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [{
                        type: "text",
                        text: {
                            content: postText,
                            link: {
                                url: postURL
                            }
                        }
                    }],
                },
            },
        ],
    });
    console.log(response);
}

async function redirect(itemText, item) {
    for (let entity of item) {
        if (entity.type === "url") {
            let link = itemText.slice(entity.offset, entity.length);
            await notionPush(link, link);
        } else if (entity.type === "text_link") {
            let link = itemText.slice(entity.offset, entity.length);
            console.log(link);
            await notionPush(link, entity.url);
        }
    }
}

const whiteList: number[] = [+process.env.CHAT_ID_1, +process.env.CHAT_ID_2];

bot.api.setMyCommands([{ command: "start", description: "Starts the bot" }]);

bot.command("start", (ctx) => {
    // Returns chat info
    console.log(`Incoming chat`, ctx.chat);
});

bot.on("message::url", async (ctx) => {
    // Security shell. Kinda white list
    // Add chat id of your account or group
    for (let chatId of whiteList) {
        if (chatId === ctx.chat.id) {
            const links = [
                ctx.msg?.text,
                ctx.msg?.entities,
                ctx.msg?.caption,
                ctx.msg?.caption_entities,
            ];

            const [text, entities, caption, captionEntities] = links;

            console.log(ctx.msg);

            if (entities) {
                await redirect(text, entities);
            } else if (captionEntities) {
                await redirect(caption, captionEntities);
            } else {
                await ctx.reply("Unknown msg structure");
            }
        } else {
            await ctx.reply("Authentication failed...");
        }
    }
});

bot.start({
    onStart: () => console.log("Started...")
});
