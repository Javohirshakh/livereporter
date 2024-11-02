const { Telegraf } = require('telegraf');
const puppeteer = require('puppeteer');
const fs = require('fs');

const bot = new Telegraf('7852775642:AAE7iRBBgJymf4Unpccml3gG_1Z38mA7n50');

// Функция для получения текущей даты и времени в формате dd.mm.yyyy hh:mm:ss
const getCurrentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};

// Обработка команды /start
bot.start((ctx) => {
    try {
        ctx.reply(`Salom!
/report - CRM dan screenshot olish`, {
            reply_to_message_id: ctx.message.message_id
        });
    } catch (error) {
        console.error('Хатолик /start буйруғини юборишда:', error);
    }
});

// Обработка команды /report
bot.command('report', async (ctx) => {
    try {
        // Отправка предварительного сообщения как ответ на команду
        const notificationMessage = await ctx.reply("Hozir...", {
            reply_to_message_id: ctx.message.message_id
        });

        // URL страницы для авторизации
        const url = 'http://192.168.100.230/';

        // Запуск Puppeteer
        let browser;
        try {
            browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
            const page = await browser.newPage();

            // Установка большого размера окна
            await page.setViewport({ width: 1920, height: 1080 });

            // Переход на страницу логина
            await page.goto(url, { waitUntil: 'networkidle2' });

            // Заполнение формы логина
            await page.type('input[name="txtUserName"]', 'Operator-13'); // Логин
            await page.type('input[name="txtUserPass"]', '000000');       // Пароль
            await page.click('input[name="btnEnter"]');                   // Нажатие на кнопку входа

            // Ожидание загрузки следующей страницы после входа
            await page.waitForNavigation({ waitUntil: 'networkidle2' });

            // Захват скриншота полной страницы после авторизации
            const screenshotPath = 'screenshot.png';
            await page.screenshot({ path: screenshotPath, fullPage: true });

            // Получение текущего времени для описания
            const currentDateTime = getCurrentDateTime();

            // Проверяем, существует ли файл скриншота
            if (fs.existsSync(screenshotPath)) {
                // Удаление предварительного сообщения
                try {
                    await ctx.deleteMessage(notificationMessage.message_id);
                } catch (deleteError) {
                    console.error('Хатолик: Огохлантириш хабарини ўчиришда:', deleteError);
                }

                // Отправка скриншота как ответ на команду с текущей датой и временем в описании
                await ctx.replyWithPhoto(
                    { source: fs.createReadStream(screenshotPath) },
                    { caption: `🕘 Vaqt: ${currentDateTime}`, reply_to_message_id: ctx.message.message_id }
                );

                // Удаление файла после отправки
                try {
                    fs.unlinkSync(screenshotPath);
                } catch (unlinkError) {
                    console.error('Хатолик: Скриншот файлни ўчиришда:', unlinkError);
                }
            } else {
                ctx.reply('Screenshot olishda xatolik yuz berdi. Screenshot olib @that_javohir ga yuboring.', {
                    reply_to_message_id: ctx.message.message_id
                });
            }

            // Закрытие браузера
            await browser.close();
        } catch (puppeteerError) {
            console.error('Puupeterda xatolik. @that_javohir ga screenshot yuboring:', puppeteerError);
            ctx.reply('Screenshot olishda xatolik yuz berdi. Screenshot olib @that_javohir ga yuboring.', {
                reply_to_message_id: ctx.message.message_id
            });
            if (browser) await browser.close();
        }
    } catch (error) {
        console.error('Хатолик /report буйруғини бажаришда:', error);
        ctx.reply('Screenshot olishda xatolik yuz berdi. Screenshot olib @that_javohir ga yuboring.', {
            reply_to_message_id: ctx.message.message_id
        });
    }
});

// Запуск бота
const startBot = async () => {
    while (true) {
        try {
            await bot.launch().then(console.log('Reporter bot is life...'));
            break;
        } catch (error) {
            console.error('Xatolik:', error);
            console.log('1 minutdan keyin qayta urinamiz...');
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }
};

startBot();
