require("dotenv").config();

//Notion API
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });

//Telegraf API
const { Bot } = require("grammy");
const url = require("url");

const bot = new Bot(process.env.BOT_TOKEN);

const notionPush = async (postURL) => {
  const blockId = "fd1e63d7d8864afb84c5e3c72ab1206b";
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
                content: postURL,
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

bot.command("start", (ctx) => {
  // Get text of new message
  console.log(`Incoming chat`, ctx.chat);
});

bot.on("message::url", async (ctx) => {
  // console.log(ctx.msg.caption_entities[0].url);
  const urlFilter =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  const link = await ctx.msg.text.match(urlFilter); //TODO: add regix filter to url in caption
  await notionPush(link[0]);
  // console.log("Successfully ?");
});

bot.start(console.log("Bot started..."));

// bot.inlineQuery(/best bot (framework|library)/, async (ctx) => {
//   await ctx.answerInlineQuery(
//     [
//       {
//         type: "article",
//         id: "grammy-website",
//         title: "grammY",
//         input_message_content: {
//           message_text:
//             "<b>grammY</b> is the best way to create your own Telegram bots. \
//     They even have a pretty website! 👇",
//           parse_mode: "HTML",
//         },
//         reply_markup: new InlineKeyboard().url(
//           "grammY website",
//           "https://grammy.dev/"
//         ),
//         url: "https://grammy.dev/",
//         description: "The Telegram Bot Framework.",
//       },
//     ],
//     { cache_time: 30 * 24 * 3600 } // one month in seconds
//   );
// });
// // Return empty result list for other queries
// bot.on("inline_query", (ctx) => ctx.answerInlineQuery([]));
