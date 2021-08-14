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

// TODO: add verification for my tg profile
bot.on("message::url", async (ctx) => {
  const urlFilter =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

  function getSafe(fn, defaultVal) {
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

  console.log(links);

  for (let link of links) {
    try {
      if (link !== undefined) {
        let filteredLink = link.match(urlFilter);
        if (filteredLink !== null) {
          console.log(
            "Found link: ",
            filteredLink[0],
            ":",
            typeof filteredLink[0]
          );
        }
        // console.log("Found link: ", filteredLink, " : ", typeof filteredLink);
      } else {
        console.log("No link found");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // try {
  //   if (typeof ctx.msg.text === "string") {
  //     const link = await ctx.msg.text.match(urlFilter);
  //     await notionPush(link[0]);
  //     console.log("Successfully ?");
  //   } else if (typeof ctx.msg.caption === "string") {
  //     const link = await ctx.msg.caption.match(urlFilter);
  //     await notionPush(link[0]);
  //   } else if (typeof ctx.msg.caption_entities[0].url === "string") {
  //     await notionPush(ctx.msg.caption_entities[0].url);
  //   } else {
  //     console.log("Fucka");
  //   }
  // } catch (e) {
  //   console.log(e);
  // }
  // console.log(ctx.msg);
  // console.log(typeof ctx.msg.text);
  // console.log(typeof ctx.msg.caption);
  // console.log(typeof ctx.msg.caption_entities[0].url);
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
