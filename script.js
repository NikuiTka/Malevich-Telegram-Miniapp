const GOOGLE_SCRIPT_URL = "nwholstnbtweather@gmail.com"; 

const state = {
    image: null,
    selectedFormat: 'passport',
    selectedSuit: 'none',
    phone: '',
    orderStatus: 'idle'
};

const BASE_PRICE = 5;
const SUIT_PRICE = 1;

const formats = {
    standard: { id: 'standard', name: 'Удостоверение (3x4)', ratio: 3 / 4, desc: 'Стандарт РФ/Украина', maskColor: 'blue' },
    passport: { id: 'passport', name: 'Паспорт (3.5x4.5)', ratio: 3.5 / 4.5, desc: 'Биометрический стандарт', maskColor: 'red' },
    visa: { id: 'visa', name: 'Виза США (5x5)', ratio: 1, desc: 'Green Card / US Visa', maskColor: 'green' }
};

const suits = {
    none: { name: 'Без костюма', img: null, price: 0 },
    suit_black: { name: 'Классика Black', img: 'https://i.imgur.com/Yw4z1Gj.png', price: SUIT_PRICE },
    suit_navy: { name: 'Navy Business', img: 'https://i.imgur.com/Yw4z1Gj.png', price: SUIT_PRICE }
};

let tg = null;

function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        tg.setBackgroundColor('#f0f2f5'); 
        
        const userInfoDiv = document.getElementById('user-info');
        if (tg.initDataUnsafe?.user) {
            userInfoDiv.textContent = tg.initDataUnsafe.user.first_name;
        } else {
            userInfoDiv.classList.add('hidden');
        }
        
        tg.MainButton.onClick(handleSubmit);
    }
}

function calculatePrice() {
    return BASE_PRICE + (state.selectedSuit !== 'none' ? SUIT_PRICE : 0);
}

function updateMainButton() {
    const price = calculatePrice();
    const mainBtn = tg ? tg.MainButton : null;

    if (!mainBtn) return;

    if (state.image && state.phone.length >= 10) {
        mainBtn.setText(`ЗАКАЗАТЬ ЗА $${price}`);
        mainBtn.show();
        mainBtn.enable();
    } else {
        mainBtn.hide();
    }
}

function updatePreviewSection() {
    const imageContainer = document.getElementById('image-display');
    const uploadButton = document.getElementById('upload-button');
    const infoPanel = document.getElementById('info-panel');
    const userPhoto = document.getElementById('user-photo');
    const currentPriceDisplay = document.getElementById('current-price-display');
    const formatDesc = document.getElementById('current-format-desc');
    const suitPreview = document.getElementById('suit-preview');
    const currentFormat = formats[state.selectedFormat];

    if (state.image) {
        uploadButton.classList.add('hidden');
        imageContainer.classList.remove('hidden');
        infoPanel.classList.remove('hidden');
        userPhoto.src = state.image;
        userPhoto.style.height = `${currentFormat.ratio * 70}%`; 
    } else {
        uploadButton.classList.remove('hidden');
        imageContainer.classList.add('hidden');
        infoPanel.classList.add('hidden');
    }

    suitPreview.innerHTML = '';
    const selectedSuitData = suits[state.selectedSuit];
    if (selectedSuitData.img) {
        const suitImg = document.createElement('img');
        suitImg.src = selectedSuitData.img;
        suitPreview.appendChild(suitImg);
    }
    
    currentPriceDisplay.textContent = `$${calculatePrice()}`;
    formatDesc.textContent = `${currentFormat.desc.split(' ')[0]}...`;

    updateMainButton();
}

function renderFormats() {
    const container = document.getElementById('formats-container');
    container.innerHTML = '';

    Object.values(formats).forEach(fmt => {
        const isSelected = state.selectedFormat === fmt.id;
        const button = document.createElement('button');
        button.className = 'format-option';
        button.innerHTML = `
            <div class="format-details">
                <div class="format-icon" style="border-color: ${fmt.maskColor}">
                    <svg class="img-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                    <div class="format-name">${fmt.name}</div>
                    <div class="format-desc">${fmt.desc}</div>
                </div>
            </div>
            ${isSelected ? `<div class="format-check"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17L4 12"/></svg></div>` : ''}
        `;
        button.onclick = () => {
            state.selectedFormat = fmt.id;
            renderFormats();
            updatePreviewSection();
        };
        container.appendChild(button);
    });
}

function renderSuits() {
    const container = document.getElementById('suits-container');
    const resetButton = document.getElementById('reset-suit-btn');
    container.innerHTML = '';

    Object.entries(suits).forEach(([key, suit]) => {
        const isSelected = state.selectedSuit === key;
        const button = document.createElement('button');
        button.className = `suit-option ${isSelected ? 'selected' : ''}`;
        button.onclick = () => {
            state.selectedSuit = key;
            renderSuits();
            updatePreviewSection();
        };

        let content = '';
        if (key === 'none') {
            content = `<svg class="img-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        } else {
            content = `<img src="${suit.img}" alt="${suit.name}" class="suit-image-preview">`;
        }

        button.innerHTML = `
            ${content}
            <span class="suit-name">${suit.name}</span>
            ${suit.price > 0 ? `
                <div class="suit-price ${isSelected ? 'selected' : 'default'}">
                    +${suit.price}$
                </div>
            ` : ''}
        `;
        container.appendChild(button);
    });
    
    if (state.selectedSuit !== 'none') {
        resetButton.classList.remove('hidden');
    } else {
        resetButton.classList.add('hidden');
    }
    resetButton.onclick = () => {
        state.selectedSuit = 'none';
        renderSuits();
        updatePreviewSection();
    };
}

function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.image = e.target.result;
            updatePreviewSection();
        };
        reader.readAsDataURL(file);
    }
}

function handlePhoneInput(event) {
    state.phone = event.target.value;
    updateMainButton();
}

async function handleSubmit() {
    if (state.phone.length < 10) {
        if (tg) tg.showAlert("Пожалуйста, введите корректный номер телефона");
        else alert("Введите номер телефона");
        return;
    }

    if (!state.image) {
        if (tg) tg.showAlert("Пожалуйста, загрузите фотографию");
        else alert("Загрузите фотографию");
        return;
    }

    if (tg) tg.MainButton.showProgress();

    const price = calculatePrice();
    const currentFormat = formats[state.selectedFormat];
    const selectedSuitData = suits[state.selectedSuit];

    const formData = new FormData();
    formData.append('phone', state.phone);
    formData.append('format_name', currentFormat.name);
    formData.append('suit_name', selectedSuitData.name);
    formData.append('total_price', price);
    formData.append('image_data', state.image);

    let success = false;
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (result.status === 'success') {
            success = true;
        } else {
             if (tg) tg.showAlert(`Ошибка сервера: ${result.message}`);
        }
    } catch (e) {
        if (tg) tg.showAlert(`Ошибка сети: ${e.message}`);
    }
    
    if (tg) tg.MainButton.hideProgress();

    if (success) {
        setOrderStatus('success');
        if (tg) tg.HapticFeedback.notificationOccurred('success');
    }
}

function setOrderStatus(status) {
    state.orderStatus = status;
    const mainScreen = document.getElementById('app-root');
    const successScreen = document.getElementById('success-screen');

    if (status === 'success') {
        mainScreen.classList.add('hidden');
        successScreen.classList.remove('hidden');
        
        document.getElementById('final-price-summary').textContent = `$${calculatePrice()}`;
        document.getElementById('final-phone-summary').textContent = state.phone;
        
        if (tg) tg.MainButton.hide();

    } else {
        mainScreen.classList.remove('hidden');
        successScreen.classList.add('hidden');
    }
}

function applyTheme(theme) {
    const body = document.body;
    const toggleButton = document.getElementById('theme-toggle');
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        if (toggleButton) {
            toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
        }
    } else {
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        if (toggleButton) {
            toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9a9 9 0 1 1-9-9Z"/></svg>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTelegram();

    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const replaceButton = document.getElementById('replace-button');
    const phoneInput = document.getElementById('phone-input');
    const closeButton = document.getElementById('close-app-button');
    
    // Theme logic
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme); 

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(currentTheme);
    });

    fileInput.addEventListener('change', handleFileChange);
    uploadButton.addEventListener('click', () => fileInput.click());
    replaceButton.addEventListener('click', () => fileInput.click());
    phoneInput.addEventListener('input', handlePhoneInput);

    closeButton.addEventListener('click', () => {
        if (tg) {
            tg.close();
        } else {
            state.image = null;
            state.phone = '';
            setOrderStatus('idle');
            updatePreviewSection();
        }
    });

    renderFormats();
    renderSuits();
    updatePreviewSection();
});
