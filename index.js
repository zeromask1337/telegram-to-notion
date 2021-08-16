require("dotenv").config();

// Notion API
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });

// Telegraf API
const { Bot } = require("grammy");
const bot = new Bot(process.env.BOT_TOKEN);

// Desired notion block
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
    // Enter chat id of your account or group
    if (
        ctx.chat.id === +process.env.CHAT_ID_1 ||
        ctx.chat.id === +process.env.CHAT_ID_2
    ) {
        const urlFilter =
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

        function getSafe(fn, defaultVal) {
            // Function to get rid of TypeError
            try {
                return fn();
            } catch (e) {
                return defaultVal;
            }
        }

        const links = [
            getSafe(() => ctx.msg.text, undefined),
            getSafe(() => ctx.msg.caption, undefined),
            getSafe(() => ctx.msg.caption_entities[0].url, undefined),
        ];

        // console.log(links); // Debug log

        const [text, caption, captionUrl] = links;

        try {
            if (text !== undefined) {
                const link = await text.match(urlFilter);
                await notionPush(link[0], link[0]);
                console.log("Successfully text");
            } else if (caption !== undefined) {
                const link = await caption.match(urlFilter);
                if (link !== null) {
                    await notionPush(link[0], link[0]);
                    console.log("Successfully caption");
                } else {
                    await notionPush(caption, captionUrl);
                    console.log("Successfully caption with url");
                }
            } else if (captionUrl !== undefined) {
                await notionPush(captionUrl, captionUrl);
                console.log("Successfully captionURL");
            } else {
                console.log("Unknown post structure...");
            }
        } catch (e) {
            console.log(e);
        }
    } else {
        await ctx.reply("Authentication failed...");
    }
});

bot.start(console.log("Bot started..."));
