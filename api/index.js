const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// Bot Token
const bot = new Telegraf('8190224846:AAF7ERKX91241pUyVDWCZzHVr1UiqfsPIXc');

// Supabase ulanishi
const supabase = createClient(
    'https://xgqctjchppduhbickbmd.supabase.co',
    'sb_publishable_E2zmVN0qXUHAovMaet8nog_8-IwSm-V'
);

const CHANNEL_ID = '@TechHub201'; // Kanal @ bilan bo'lishi shart!

bot.start(async (ctx) => {
    // Vercel domenini dinamik aniqlash
    const host = ctx.get('host') || 'mening-botim.vercel.app';
    const webAppUrl = `https://${host}`;

    try {
        await ctx.replyWithHTML(
            `<b>Assalomu alaykum, ${ctx.from.first_name}!</b>\n\n` +
            `🎁 <b>Giveaway</b>da qatnashish uchun "Qatnashish" tugmasini bosing.\n` +
            `<i>Eslatma: Kanalimizga obuna bo'lishingiz shart!</i>`,
            Markup.inlineKeyboard([
                [Markup.button.callback("🎉 Qatnashish", "join_giveaway")],
                [Markup.button.webApp("📊 Admin Panel", webAppUrl)]
            ])
        );
    } catch (e) {
        console.error("Start error:", e);
    }
});

bot.action('join_giveaway', async (ctx) => {
    const userId = String(ctx.from.id);
    const username = ctx.from.username || "NoUsername";
    const firstName = ctx.from.first_name || "User";

    try {
        // 1. Kanalga obunani tekshirish
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
        
        if (['left', 'kicked'].includes(member.status)) {
            return ctx.answerCbQuery("❌ Avval kanalga obuna bo'ling!", { show_alert: true });
        }

        // 2. Bazada borligini tekshirish
        const { data: existing, error: selectError } = await supabase
            .from('participants')
            .select('id')
            .eq('telegram_id', userId);

        if (existing && existing.length > 0) {
            return ctx.answerCbQuery("✅ Siz allaqachon ro'yxatga olingansiz!", { show_alert: true });
        }

        // 3. Bazaga saqlash
        const { error: insertError } = await supabase.from('participants').insert([
            { telegram_id: userId, username: username, first_name: firstName }
        ]);

        if (insertError) throw insertError;

        await ctx.answerCbQuery("🎉 Tabriklaymiz! Siz ro'yxatga olindingiz.", { show_alert: true });
        await ctx.editMessageText("✅ Siz muvaffaqiyatli qatnashuvchisiz!");

    } catch (e) {
        console.error("Action error:", e);
        ctx.answerCbQuery("Xatolik yuz berdi: " + e.message);
    }
});

// Vercel uchun eksport
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error("Update error:", err);
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot ishlayapti...');
    }
};
        
