const { Telegraf, Markup } = require('telegraf');
const { MsEdgeTTS } = require('edge-tts');
const fs = require('fs');
const path = require('path');

// --- KONFIGURATSIYA ---
const BOT_TOKEN = '8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc';
const CHANNEL_ID = '@TechHub201'; // Majburiy kanal
const CREATOR = '@HTML5_5';       // Bot yaratuvchisi

const bot = new Telegraf(BOT_TOKEN);
const tts = new MsEdgeTTS();

// Matnlarni vaqtincha saqlash uchun xotira
const userContext = new Map();

/**
 * MAJBURIY OBUNA TEKSHIRUVCHI (Middleware)
 */
async function checkSub(ctx, next) {
    if (ctx.from.username === 'HTML5_5') return next(); // Creatorga ruxsat
    
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        const allowed = ['member', 'administrator', 'creator'];
        
        if (allowed.includes(member.status)) {
            return next();
        }
        
        return ctx.replyWithHTML(
            `<b>Botdan foydalanish uchun kanalimizga obuna bo'ling!</b>\n\n` +
            `Obuna bo'lgach, qaytadan matn yuboring.`,
            Markup.inlineKeyboard([
                [Markup.button.url("📢 Kanalga obuna bo'lish", `https://t.me/${CHANNEL_ID.replace('@','')}`)],
                [Markup.button.callback("✅ Tekshirish", "verify_sub")]
            ])
        );
    } catch (error) {
        // Kanalda bot admin bo'lmasa yoki boshqa xato bo'lsa
        console.log("Sub Check Error:", error);
        return next();
    }
}

/**
 * START BUYRUG'I
 */
bot.start(async (ctx) => {
    await ctx.replyWithHTML(
        `<b>Assalomu alaykum, ${ctx.from.first_name}!</b>\n\n` +
        `🎙 Men matnlarni <b>o'ta realistik</b> ovozga aylantiruvchi professional botman.\n\n` +
        `✍️ Menga matn yuboring, men uni <b>Erkak (Sardor)</b> yoki <b>Ayol (Madina)</b> ovozida o'qib beraman.\n\n` +
        `👨‍💻 <b>Dasturchi:</b> ${CREATOR}`,
        Markup.inlineKeyboard([
            [Markup.button.url("📢 Kanalimiz", `https://t.me/${CHANNEL_ID.replace('@','')}`)]
        ])
    );
});

/**
 * MATN QABUL QILISH
 */
bot.on('text', checkSub, async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;

    const text = ctx.message.text;
    if (text.length > 1500) return ctx.reply("⚠️ Matn juda uzun (maksimal 1500 ta belgi).");

    const userId = ctx.from.id;
    userContext.set(userId, text); // Matnni eslab qolamiz

    await ctx.replyWithHTML("<b>Qaysi ovozda eshitishni xohlaysiz?</b>", 
        Markup.inlineKeyboard([
            [
                Markup.button.callback("👨 Sardor (Erkak)", "voice_male"),
                Markup.button.callback("👩 Madina (Ayol)", "voice_female")
            ]
        ])
    );
});

/**
 * OVOZLASHTIRISH VA YUBORISH
 */
bot.action(/voice_(male|female)/, async (ctx) => {
    const userId = ctx.from.id;
    const text = userContext.get(userId);
    const gender = ctx.match[1];

    if (!text) {
        return ctx.answerCbQuery("⚠️ Matn topilmadi. Qaytadan yuboring.", { show_alert: true });
    }

    const voice = (gender === 'male') ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
    const name = (gender === 'male') ? 'Sardor' : 'Madina';

    await ctx.answerCbQuery(`🎙 ${name} ovozi tayyorlanmoqda...`);
    await ctx.editMessageText(`⌛ <b>${name}</b> ovozida professional ovozlashtirilmoqda...`, { parse_mode: 'HTML' });

    const tempFile = path.join('/tmp', `tts_${userId}_${Date.now()}.mp3`);

    try {
        await tts.setMetadata(voice, 'output_format');
        await tts.toFile(tempFile, text);

        await ctx.sendVoice({ 
            source: tempFile,
            caption: `🎙 <b>Ovoz:</b> ${name} (Neural)\n👨‍💻 <b>Dasturchi:</b> ${CREATOR}`,
            parse_mode: 'HTML'
        });

        await ctx.deleteMessage(); // Yuklanmoqda xabarini o'chirish
        userContext.delete(userId); // Xotirani tozalash
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik: Microsoft serveri bilan aloqa uzildi yoki matn formati xato.");
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
});

// Tekshirish tugmasi uchun
bot.action('verify_sub', async (ctx) => {
    await ctx.answerCbQuery("Endi matn yuborib ko'ring!");
    await ctx.deleteMessage();
});

/**
 * VERCEL EXPORT
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
        res.status(200).send(`Professional TTS Bot by ${CREATOR} is active.`);
    }
};
