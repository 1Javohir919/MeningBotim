const { Telegraf, Markup } = require('telegraf');
const { MsEdgeTTS } = require('edge-tts');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf('8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc');
const tts = new MsEdgeTTS();

const CHANNEL_ID = '@TechHub201';
const CREATOR = '@HTML5_5';

// Xotira (Vaqtinchalik)
const userContext = new Map();

// Majburiy obuna tekshiruvi
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
    ctx.replyWithHTML(
        `<b>Assalomu alaykum, ${ctx.from.first_name}!</b>\n\n` +
        `🎙 Men matnlarni o'ta realistik ovozga aylantiraman.\n` +
        `✍️ Matn yuboring va ovozni tanlang.\n\n` +
        `👨‍💻 <b>Dasturchi:</b> ${CREATOR}`
    );
});

bot.on('text', checkSub, async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    
    userContext.set(ctx.from.id, ctx.message.text);
    await ctx.replyWithHTML("<b>Qaysi ovozda eshitishni xohlaysiz?</b>", 
        Markup.inlineKeyboard([
            [
                Markup.button.callback("👨 Sardor (Erkak)", "m"), 
                Markup.button.callback("👩 Madina (Ayol)", "f")
            ]
        ])
    );
});

bot.action(['m', 'f'], async (ctx) => {
    const userId = ctx.from.id;
    const text = userContext.get(userId);
    
    if (!text) return ctx.answerCbQuery("⚠️ Matn topilmadi, qaytadan yuboring.", { show_alert: true });

    const voice = ctx.callbackQuery.data === 'm' ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
    const name = ctx.callbackQuery.data === 'm' ? 'Sardor' : 'Madina';

    await ctx.answerCbQuery(`🎙 ${name} ovozi...`);
    await ctx.editMessageText(`⌛ <b>${name}</b> ovozida tayyorlanmoqda...`, { parse_mode: 'HTML' });

    const tempFile = path.join('/tmp', `tts_${userId}_${Date.now()}.mp3`);

    try {
        await tts.setMetadata(voice, 'output_format');
        await tts.toFile(tempFile, text);

        await ctx.sendVoice({ 
            source: tempFile,
            caption: `🎙 <b>Ovoz:</b> ${name}\n👨‍💻 <b>Dasturchi:</b> ${CREATOR}`,
            parse_mode: 'HTML'
        });

        await ctx.deleteMessage();
        userContext.delete(userId);
    } catch (err) {
        ctx.reply("❌ Xatolik yuz berdi. Matnni qisqartirib ko'ring.");
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
});

bot.action('verify', (ctx) => ctx.answerCbQuery("Endi matn yuboring!"));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (e) { res.status(500).send('Error'); }
    } else {
        res.status(200).send('Professional TTS Bot is Active');
    }
};
                    
