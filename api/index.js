const { Telegraf, Markup } = require('telegraf');
const { MsEdgeTTS } = require('edge-tts');
const fs = require('fs');

// --- KONFIGURATSIYA ---
const BOT_TOKEN = '8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc';
const CHANNEL_ID = '@TechHub201';
const CREATOR = '@HTML5_5';

const bot = new Telegraf(BOT_TOKEN);
const tts = new MsEdgeTTS();

const userContext = new Map();

/**
 * MAJBURIY OBUNA TEKSHIRUVCHI
 */
async function checkSub(ctx, next) {
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        const allowed = ['member', 'administrator', 'creator'];

        if (allowed.includes(member.status)) {
            return next();
        }

        return ctx.replyWithHTML(
            `<b>Botdan foydalanish uchun kanalga obuna bo‘ling!</b>`,
            Markup.inlineKeyboard([
                [Markup.button.url("📢 Obuna bo‘lish", `https://t.me/${CHANNEL_ID.replace('@','')}`)],
                [Markup.button.callback("✅ Tekshirish", "verify_sub")]
            ])
        );
    } catch (e) {
        console.log("Sub error:", e);
        return next();
    }
}

/**
 * START
 */
bot.start((ctx) => {
    ctx.replyWithHTML(
        `<b>Salom ${ctx.from.first_name}!</b>\n\n` +
        `🎙 Matnni real ovozga aylantiraman\n\n` +
        `👨‍💻 ${CREATOR}`,
        Markup.inlineKeyboard([
            [Markup.button.url("📢 Kanal", `https://t.me/${CHANNEL_ID.replace('@','')}`)]
        ])
    );
});

/**
 * MATN QABUL
 */
bot.on('text', checkSub, async (ctx) => {
    const text = ctx.message.text;

    if (text.startsWith('/')) return;

    if (text.length > 1500) {
        return ctx.reply("⚠️ 1500 belgidan oshmasin");
    }

    const userId = ctx.from.id;
    userContext.set(userId, text);

    // AUTO DELETE MEMORY (5 min)
    setTimeout(() => userContext.delete(userId), 5 * 60 * 1000);

    await ctx.reply(
        "🎧 Ovoz tanlang:",
        Markup.inlineKeyboard([
            [
                Markup.button.callback("👨 Erkak", "voice_male"),
                Markup.button.callback("👩 Ayol", "voice_female")
            ]
        ])
    );
});

/**
 * OVOZ GENERATSIYA
 */
bot.action(/voice_(male|female)/, async (ctx) => {
    const userId = ctx.from.id;
    const text = userContext.get(userId);

    if (!text) {
        return ctx.answerCbQuery("Matn topilmadi", { show_alert: true });
    }

    const gender = ctx.match[1];
    const voice = gender === 'male'
        ? 'uz-UZ-SardorNeural'
        : 'uz-UZ-MadinaNeural';

    const name = gender === 'male' ? 'Sardor' : 'Madina';

    await ctx.answerCbQuery("⏳ Tayyorlanmoqda...");
    await ctx.editMessageText(`⌛ ${name} ovoz...`, { parse_mode: 'HTML' });

    const filePath = `/tmp/${Date.now()}.mp3`;

    try {
        // TO‘G‘RILANGAN EDGE-TTS
        await tts.toFile(filePath, text, voice);

        await ctx.replyWithVoice({
            source: filePath
        }, {
            caption: `🎙 ${name} ovozi\n👨‍💻 ${CREATOR}`
        });

        userContext.delete(userId);

    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi");
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

/**
 * VERIFY BUTTON
 */
bot.action('verify_sub', async (ctx) => {
    await ctx.answerCbQuery("Tekshirildi!");
    await ctx.deleteMessage();
});

/**
 * VERCEL HANDLER
 */
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (e) {
            console.error(e);
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot ishlayapti 🚀');
    }
};
