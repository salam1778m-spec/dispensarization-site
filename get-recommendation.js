// Файл: netlify/functions/get-recommendation.js

exports.handler = async function(event) {
    // 1. Получаем данные, которые прислал сайт (из браузера)
    const { age, gender, smoking, activity } = JSON.parse(event.body);

    // 2. Получаем секретный API-ключ из безопасного хранилища Netlify
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key is not configured." })
        };
    }

    // 3. Формируем тот же самый промпт для Gemini
    const prompt = `
        Ты — дружелюбный и ободряющий ассистент на сайте клиники. 
        Твоя задача — на основе кратких данных о пользователе написать короткую (2-3 предложения) и позитивную рекомендацию, почему ему стоит пройти бесплатный профилактический осмотр. 
        Не ставь диагнозы и не давай медицинских советов. Не используй медицинский жаргон.
        Твоя цель — мотивировать, а не напугать. Обращайся к пользователю на "вы".
        Данные пользователя:
        - Возраст: ${age}
        - Пол: ${gender}
        - Курение: ${smoking}
        - Уровень физической активности: ${activity}
        Сгенерируй рекомендацию для указанных данных.
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        // 4. Отправляем запрос к Gemini с сервера Netlify
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        // 5. Отправляем готовый ответ обратно на сайт (в браузер)
        return {
            statusCode: 200,
            body: JSON.stringify({ recommendation: text || "Не удалось сгенерировать рекомендацию." })
        };
    } catch (error) {
        console.error("Error in serverless function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to get recommendation from Gemini." })
        };
    }
};
