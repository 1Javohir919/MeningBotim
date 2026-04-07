const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf('8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc');
const supabase = createClient(
    'https://xgqctjchppduhbickbmd.supabase.co',
    'sb_publishable_E2zmVN0qXUHAovMaet8nog_8-IwSm-V'
);

const CHANNEL_ID = '@TechHub201'; // Shu yerga kanal usernamesini yozing

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const webAppUrl = `https://${ctx.host}`;

    await ctx.replyWithHTML(
        `<b>Assalomu alaykum, ${ctx.from.first_name}!</b>\n\n` +
        `🎁 <b>Giveaway</b>da qatnashish uchun "Qatnashish" tugmasini bosing.\n` +
        `<i>Eslatma: Kanalimizga obuna bo'lishingiz shart!</i>`,
        Markup.inlineKeyboard([
            [Markup.button.callback("🎉 Qatnashish", "join_giveaway")],
            [Markup.button.webApp("📊 Admin Panel", webAppUrl)]
        ])
    );
});

bot.action('join_giveaway', async (ctx) => {
    const userId = String(ctx.from.id);
    const username = ctx.from.username || "NoUsername";

    try {
        // 1. Kanalga obunani tekshirish
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
        if (['left', 'kicked'].includes(member.status)) {
            return ctx.answerCbQuery("❌ Avval kanalga obuna bo'ling!", { show_alert: true });
        }

        // 2. Bazada borligini tekshirish (Duplicate check)
        const { data: existing } = await supabase
            .from('participants')
            .select('id')
            .eq('telegram_id', userId)
            .single();

        if (existing) {
            return ctx.answerCbQuery("✅ Siz allaqachon ro'yxatga olingansiz!", { show_alert: true });
        }

        // 3. Bazaga saqlash
        await supabase.from('participants').insert([
            { telegram_id: userId, username: username, first_name: ctx.from.first_name }
        ]);

        ctx.answerCbQuery("🎉 Tabriklaymiz! Siz ro'yxatga olindingiz.", { show_alert: true });
        ctx.editMessageText("✅ Siz muvaffaqiyatli qatnashuvchisiz!");

    } catch (e) {
        ctx.answerCbQuery("Xatolik yuz berdi!");
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot Active');
    }
};
      
