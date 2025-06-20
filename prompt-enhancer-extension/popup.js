// 儲存 DOM 元素引用
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const templateTextarea = document.getElementById('template');
const testApiKeyBtn = document.getElementById('testApiKey');
const saveSettingsBtn = document.getElementById('saveSettings');
const enableFeasibilityCheckbox = document.getElementById('enableFeasibilityCheck');

// 載入已儲存的設定
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'apiKey', 'selectedModel', 'template', 'enableFeasibilityCheck'
        ]);
        
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
            await loadModels(result.apiKey);
        }
        
        if (result.selectedModel) {
            modelSelect.value = result.selectedModel;
        }
        
        if (result.template) {
            templateTextarea.value = result.template;
        }
        
        if (result.enableFeasibilityCheck !== undefined) {
            enableFeasibilityCheckbox.checked = result.enableFeasibilityCheck;
        }
        
    } catch (error) {
        console.error('載入設定失敗:', error);
    }
}

// 顯示狀態訊息 (使用浮動彈出視窗)
function showStatus(message, type = 'success') {
    const existingNotice = document.querySelector('.popup-status-notice');
    if (existingNotice) {
        existingNotice.remove();
    }

    const notice = document.createElement('div');
    notice.className = `popup-status-notice ${type}`;
    notice.textContent = message;

    // 樣式
    notice.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;

    document.body.appendChild(notice);

    // 淡入效果
    setTimeout(() => {
        notice.style.opacity = '1';
    }, 10);

    // 淡出並移除
    setTimeout(() => {
        notice.style.opacity = '0';
        notice.addEventListener('transitionend', () => notice.remove());
    }, 3000);
}

// 載入 Gemini 模型列表
async function loadModels(apiKey) {
    if (!apiKey) {
        modelSelect.innerHTML = '<option value="">請先設定 API Key</option>';
        modelSelect.disabled = true;
        return;
    }

    try {
        showStatus('載入模型列表中...', 'loading');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 清空選項
        modelSelect.innerHTML = '';
        
        // 過濾並添加支援 generateContent 的模型
        const supportedModels = data.models.filter(model =>
            model.supportedGenerationMethods &&
            model.supportedGenerationMethods.includes('generateContent') &&
            model.name.includes('gemini') && // 只列出模型代碼中有gemini的項目
            model.name.includes('flash') && // 只列出模型代碼中有flash的項目
            !model.name.includes('1.5') &&   // 過濾掉1.5的版本
            !model.name.includes('lite') //過濾掉Lite版本
        );
        
        if (supportedModels.length === 0) {
            modelSelect.innerHTML = '<option value="">沒有可用的模型</option>';
            modelSelect.disabled = true;
            showStatus('未找到支援的模型', 'error');
            return;
        }
        
        supportedModels.forEach(model => {
            const option = document.createElement('option');
            // 去除 "models/" 前綴，只保留模型名稱
            const modelName = model.name.replace(/^models\//, '');
            option.value = modelName;
            option.textContent = model.displayName || modelName;
            modelSelect.appendChild(option);
        });
        
        modelSelect.disabled = false;
        showStatus('模型列表載入成功', 'success');
        
    } catch (error) {
        console.error('載入模型失敗:', error);
        modelSelect.innerHTML = '<option value="">載入失敗</option>';
        modelSelect.disabled = true;
        showStatus('載入模型失敗，請檢查 API Key', 'error');
    }
}

// 測試 API Key
async function testApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus('請先輸入 API Key', 'error');
        return;
    }
    
    testApiKeyBtn.disabled = true;
    testApiKeyBtn.textContent = '測試中...';
    
    try {
        await loadModels(apiKey);
        showStatus('API Key 驗證成功！', 'success');
    } catch (error) {
        showStatus('API Key 驗證失敗', 'error');
    } finally {
        testApiKeyBtn.disabled = false;
        testApiKeyBtn.textContent = '測試 API Key';
    }
}

// 儲存設定
async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;
    const template = templateTextarea.value.trim();
    const enableFeasibilityCheck = enableFeasibilityCheckbox.checked;
    
    if (!apiKey) {
        showStatus('請輸入 API Key', 'error');
        return;
    }
    
    if (!selectedModel) {
        showStatus('請選擇模型', 'error');
        return;
    }
    
    if (!template) {
        showStatus('請輸入強化模板', 'error');
        return;
    }
    
    if (!template.includes('{{prompt}}')) {
        showStatus('模板必須包含 {{prompt}} 佔位符', 'error');
        return;
    }
    
    try {
        await chrome.storage.sync.set({
            apiKey: apiKey,
            selectedModel: selectedModel,
            template: template,
            enableFeasibilityCheck: enableFeasibilityCheck
        });
        
        showStatus('設定儲存成功！', 'success');
    } catch (error) {
        console.error('儲存設定失敗:', error);
        showStatus('儲存設定失敗', 'error');
    }
}



// 綁定事件監聽器
testApiKeyBtn.addEventListener('click', testApiKey);
saveSettingsBtn.addEventListener('click', saveSettings);

// API Key 輸入變化時重置模型選單
apiKeyInput.addEventListener('input', () => {
    modelSelect.innerHTML = '<option value="">請先測試 API Key</option>';
    modelSelect.disabled = true;
});

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', loadSettings); 