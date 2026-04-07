const { Telegraf, Markup } = require('telegraf');
const { MsEdgeTTS } = require('edge-tts');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf('8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc');
const tts = new MsEdgeTTS();

const CHANNEL_ID = '@TechHub201';
const CREATOR = '@HTML5_5';

// Vaqtincha saqlash
const userContext = new Map();

// Obunani tekshirish
async function checkSub(ctx, next) {
    if (ctx.from.username === 'HTML5_5') return next();
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(member.status)) return next();
        
        return ctx.replyWithHTML(
            `<b>Botdan foydalanish uchun kanalga a'zo bo'ling!</b>`,
            Markup.inlineKeyboard([
                [Markup.button.url("📢 Kanalga a'zo bo'lish", `https://t.me/${CHANNEL_ID.replace('@','')}`)],
                [Markup.button.callback("✅ Tekshirish", "verify")]
            ])
        );
    } catch (e) { return next(); }
}

bot.start((ctx) => {
    ctx.replyWithHTML(`<b>Salom, ${ctx.from.first_name}!</b>\nMatn yuboring, men uni realistik ovozga aylantiraman.\n\n👨‍💻 @HTML5_5`);
});

bot.on('text', checkSub, async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    
    userContext.set(ctx.from.id, ctx.message.text);
    await ctx.replyWithHTML("<b>Ovoz turini tanlang:</b>", 
        Markup.inlineKeyboard([
            [Markup.button.callback("👨 Sardor (Erkak)", "m"), Markup.button.callback("👩 Madina (Ayol)", "f")]
        ])
    );
});

bot.action(['m', 'f'], async (ctx) => {
    const text = userContext.get(ctx.from.id);
    if (!text) return ctx.answerCbQuery("Matn topilmadi!");

    const voice = ctx.callbackQuery.data === 'm' ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
    await ctx.answerCbQuery("🎙 Tayyorlanmoqda...");
    await ctx.editMessageText("⏳ Ovoz yozilmoqda...");

    const tempFile = path.join('/tmp', `tts_${ctx.from.id}.mp3`);

    try {
        await tts.setMetadata(voice, 'output_format');
        await tts.toFile(tempFile, text);
        await ctx.sendVoice({ source: tempFile });
        await ctx.deleteMessage();
    } catch (err) {
        ctx.reply("❌ Xatolik yuz berdi.");
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        userContext.delete(ctx.from.id);
    }
});

bot.action('verify', (ctx) => ctx.answerCbQuery("Endi matn yuboring!"));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot Active');
    }
};
                 
