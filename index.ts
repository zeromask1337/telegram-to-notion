// noinspection JSIgnoredPromiseFromCall

import 'dotenv/config';
import { Client } from "@notionhq/client";
import { Bot } from "grammy";
import { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });
const bot = new Bot(process.env.BOT_TOKEN);
const whiteList: number[] = [+process.env.CHAT_ID_1, +process.env.CHAT_ID_2];


// Type-guard
function isTodo <T extends Record<string, unknown>>(obj: T): obj is T & { type: 'to_do' } {
    return 'type' in obj && obj.type === 'to_do';
}

// Checks if link already exists in Notion page
function alreadyExists(link: string, list: ListBlockChildrenResponse) {
    for (const result of list.results) {
        if (isTodo(result)) {
            if (result.to_do.rich_text[0].href == link) {
                return true;
            }
        }
    }
}

// Pushes link to the end of specified Notion block
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


bot.api.setMyCommands([{ command: "start", description: "Starts the bot" }]);

bot.command("start", (ctx) => {
    // Returns chat info
    console.log(`Incoming chat`, ctx.chat);
});

// bot.on("message", (ctx) => console.log("Chat id", ctx.chat.id));

bot.on("message::url", async (ctx) => {
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
        await ctx.reply("Unknown message structure");
    }
});

bot.start({
    onStart: () => console.log("Started...")
});
