const axios = require('axios');

/**
 * Sends a Telegram notification alert
 * @param {string} message - Message text (HTML formatting supported)
 * @param {object} options - Optional config { parseMode, disableWebPagePreview }
 * @returns {Promise<boolean>}
 */
async function sendTelegramAlert(message, options = {}) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn('⚠️ Telegram Alert Warning: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env file.');
        return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: options.parseMode || 'HTML',
            disable_web_page_preview: options.disableWebPagePreview || true
        });

        if (response.data && response.data.ok) {
            console.log('✅ Telegram alert sent successfully!');
            return true;
        } else {
            console.error('❌ Telegram alert failed:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Telegram alert error:', error.response?.data || error.message);
        return false;
    }
}

module.exports = {
    sendTelegramAlert
};
