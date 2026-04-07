const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf('8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc');
const supabase = createClient(
    'https://xgqctjchppduhbickbmd.supabase.co',
    'sb_publishable_E2zmVN0qXUHAovMaet8nog_8-IwSm-V'
);

const CHANNEL_ID = '@TechHub201';
const WEB_APP_URL = 'https://mening-botim.vercel.app';

bot.start(async (ctx) => {
    try {
        await ctx.replyWithHTML(
            `<b>Salom, ${ctx.from.first_name}!</b>\n\n` +
            `🎁 Konkursda qatnashish uchun tugmani bosing:`,
            Markup.inlineKeyboard([
                [Markup.button.callback("🎉 Qatnashish", "join_giveaway")],
                [Markup.button.webApp("📊 Admin Panel", WEB_APP_URL)]
            ])
        );
    } catch (e) { console.log(e); }
});

bot.action('join_giveaway', async (ctx) => {
    try {
        const userId = String(ctx.from.id);
        
        // 1. Obunani tekshirish
        const chatMember = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
        if (['left', 'kicked'].includes(chatMember.status)) {
            return ctx.answerCbQuery("❌ Avval kanalga obuna bo'ling!", { show_alert: true });
        }

        // 2. Bazaga yozish
        const { error } = await supabase.from('participants').insert([
            { 
                telegram_id: userId, 
                username: ctx.from.username || "no_user", 
                first_name: ctx.from.first_name 
            }
        ]);

        if (error && error.code === '23505') {
            return ctx.answerCbQuery("✅ Siz allaqachon qatnashgansiz!", { show_alert: true });
        }

        await ctx.answerCbQuery("🎉 Siz ro'yxatga olindingiz!", { show_alert: true });
        await ctx.editMessageText("✅ Qatnashish tasdiqlandi!");
    } catch (e) {
        ctx.answerCbQuery("Xatolik yuz berdi!");
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (e) { res.status(500).send('Error'); }
    } else {
        res.status(200).send('Bot ishlayapti...');
    }
};
            
