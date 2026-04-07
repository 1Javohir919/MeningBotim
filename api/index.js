const { Telegraf, Markup } = require('telegraf');
const { MsEdgeTTS } = require('edge-tts');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf('8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc');
const CHANNEL_ID = '@TechHub201';
const CREATOR = '@HTML5_5';

// Vaqtinchalik xotira
const userContext = new Map();

bot.start((ctx) => {
    ctx.replyWithHTML(`<b>Salom!</b> Matn yuboring va ovozni tanlang.\n\n👨‍💻 @HTML5_5`);
});

bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    
    // Matnni eslab qolamiz
    userContext.set(ctx.from.id, ctx.message.text);
    
    await ctx.replyWithHTML("<b>Ovozni tanlang:</b>", 
        Markup.inlineKeyboard([
            [Markup.button.callback("👨 Sardor", "m"), Markup.button.callback("👩 Madina", "f")]
        ])
    );
});

bot.action(['m', 'f'], async (ctx) => {
    const text = userContext.get(ctx.from.id);
    if (!text) return ctx.answerCbQuery("Matn topilmadi, qayta yuboring!");

    const voice = ctx.callbackQuery.data === 'm' ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
    const tempFile = path.join('/tmp', `tts_${Date.now()}.mp3`);

    try {
        await ctx.answerCbQuery("🎙 Tayyorlanmoqda...");
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, 'output_format');
        
        // Ovoz yaratish
        await tts.toFile(tempFile, text);
        
        // Audio yuborish
        await ctx.replyWithVoice({ source: tempFile }, {
            caption: `🎙 @HTML5_5 tomonidan tayyorlandi`
        });
        
        // Tozalash
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        userContext.delete(ctx.from.id);
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Matn juda uzun bo'lishi mumkin.");
    }
});

// Vercel uchun eksport
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
        }
        res.status(200).send('OK');
    } catch (e) {
        console.error(e);
        res.status(200).send('OK'); // Vercel 500 bermasligi uchun doim 200 qaytaramiz
    }
};
                
