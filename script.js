if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.setBackgroundColor('#000000'); 
} else {
    console.log("Mini App не запущен внутри Telegram.");
}
