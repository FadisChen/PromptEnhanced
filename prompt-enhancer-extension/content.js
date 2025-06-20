// 全局狀態管理
let originalPrompt = '';
let isOptimized = false;
let undoButton = null;

// 網站配置
const SITE_CONFIGS = {
    'chatgpt.com': {
        name: 'ChatGPT',
        insertSelector: 'button[aria-label*="工具"], button[aria-label*="Tools"], button[data-testid*="tools"]',
        insertPosition: 'before',
        textareaSelector: '#prompt-textarea, [contenteditable="true"][data-id*="root"]',
        getTextContent: (element) => {
            // 獲取 ProseMirror 編輯器中的 <p> 標籤內容
            const pElement = element.querySelector('p');
            return pElement ? pElement.textContent || '' : element.textContent || '';
        },
        setTextContent: (element, text) => {
            // 設置 ProseMirror 編輯器中的 <p> 標籤內容
            const pElement = element.querySelector('p');
            if (pElement) {
                pElement.textContent = text;
            } else {
                element.innerHTML = `<p>${text}</p>`;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.focus();
        }
    },
    'claude.ai': {
        name: 'Claude',
        insertSelector: '.flex.flex-row.items-center.gap-2.min-w-0',
        insertPosition: 'before',
        textareaSelector: '.ProseMirror[contenteditable="true"]',
        getTextContent: (element) => {
            // 獲取 ProseMirror 編輯器中的 <p> 標籤內容
            const pElement = element.querySelector('p');
            return pElement ? pElement.textContent || '' : element.textContent || '';
        },
        setTextContent: (element, text) => {
            // 設置 ProseMirror 編輯器中的 <p> 標籤內容
            const pElement = element.querySelector('p');
            if (pElement) {
                pElement.textContent = text;
            } else {
                element.innerHTML = `<p>${text}</p>`;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.focus();
        }
    },
    'gemini.google.com': {
        name: 'Gemini',
        insertSelector: 'toolbox-drawer-item',
        insertPosition: 'before',
        textareaSelector: '.ql-editor[contenteditable="true"]',
        getTextContent: (element) => {
            // 獲取 Quill 編輯器中的 <p> 標籤內容
            const pElement = element.querySelector('p');
            return pElement ? pElement.textContent || '' : element.textContent || '';
        },
        setTextContent: (element, text) => {
            // 設置 Quill 編輯器中的 <p> 標籤內容
            const pElement = element.querySelector('p');
            if (pElement) {
                pElement.textContent = text;
            } else {
                element.innerHTML = `<p>${text}</p>`;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.focus();
        }
    }
};

// 獲取當前網站配置
function getCurrentSiteConfig() {
    const hostname = window.location.hostname;
    for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
        if (hostname.includes(domain)) {
            return config;
        }
    }
    return null;
}

// 創建強化按鈕
function createEnhanceButton() {
    const button = document.createElement('button');
    button.type = 'button'; // 明確指定為普通按鈕，不是提交按鈕
    button.innerHTML = `
        <span class="btn-icon">✨</span>
        <span class="btn-text">優化</span>
    `;
    button.title = '使用 AI 優化 Prompt';
    button.className = 'prompt-enhancer-btn';
    
    // 根據網站調整樣式
    const siteConfig = getCurrentSiteConfig();
    if (siteConfig) {
        button.setAttribute('data-site', siteConfig.name.toLowerCase());
    }
    if (siteConfig && siteConfig.name === 'ChatGPT') {
        // ChatGPT 工具欄樣式
        button.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #ffffff;
            cursor: pointer;
            font-size: 14px;
            margin: 0 4px;
            padding: 8px 12px;
            transition: all 0.3s ease;
            z-index: 10000;
            position: relative;
            font-family: inherit;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-width: auto;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
    } else {
        // 其他網站的樣式
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            margin: 0 6px;
            padding: 8px 16px;
            transition: all 0.3s ease;
            z-index: 10000;
            position: relative;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            min-width: 80px;
            justify-content: center;
        `;
    }
    
    // 懸停效果
    button.addEventListener('mouseenter', () => {
        if (siteConfig && siteConfig.name === 'ChatGPT') {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        } else {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }
    });
    
    button.addEventListener('mouseleave', () => {
        if (siteConfig && siteConfig.name === 'ChatGPT') {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
            button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        }
    });
    
    // 點擊事件 - 加入防抖，使用捕獲階段確保優先處理
    button.addEventListener('click', debounce(handleEnhanceClick, 1000), true);
    
    // 額外的安全措施：阻止任何可能的表單提交
    button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }, true);
    
    return button;
}

// 防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 創建還原按鈕
function createUndoButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = '↶';
    button.title = '還原到優化前的 Prompt';
    button.className = 'prompt-undo-btn';
    
    // 根據網站調整樣式
    const siteConfig = getCurrentSiteConfig();
    if (siteConfig) {
        button.setAttribute('data-site', siteConfig.name.toLowerCase());
    }
    
    if (siteConfig && siteConfig.name === 'ChatGPT') {
        // ChatGPT 工具欄樣式
        button.style.cssText = `
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.3);
            border-radius: 8px;
            color: #ffa500;
            cursor: pointer;
            font-size: 16px;
            margin: 0 4px;
            padding: 8px 10px;
            transition: all 0.3s ease;
            z-index: 10000;
            position: relative;
            font-family: inherit;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: auto;
            backdrop-filter: blur(10px);
        `;
    } else {
        // 其他網站的樣式
        button.style.cssText = `
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 16px;
            margin: 0 4px;
            padding: 8px 10px;
            transition: all 0.3s ease;
            z-index: 10000;
            position: relative;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
            min-width: auto;
        `;
    }
    
    // 懸停效果
    button.addEventListener('mouseenter', () => {
        if (siteConfig && siteConfig.name === 'ChatGPT') {
            button.style.background = 'rgba(255, 165, 0, 0.2)';
            button.style.borderColor = 'rgba(255, 165, 0, 0.4)';
        } else {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.4)';
        }
    });
    
    button.addEventListener('mouseleave', () => {
        if (siteConfig && siteConfig.name === 'ChatGPT') {
            button.style.background = 'rgba(255, 165, 0, 0.1)';
            button.style.borderColor = 'rgba(255, 165, 0, 0.3)';
        } else {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.3)';
        }
    });
    
    // 點擊事件
    button.addEventListener('click', handleUndoClick, true);
    
    return button;
}

// 處理還原按鈕點擊
function handleUndoClick(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    if (!originalPrompt || !isOptimized) return;
    
    const siteConfig = getCurrentSiteConfig();
    if (!siteConfig) return;
    
    const textareaElement = document.querySelector(siteConfig.textareaSelector);
    if (!textareaElement) {
        showNotice('找不到輸入框', 'error');
        return;
    }
    
    // 還原到原始 prompt
    siteConfig.setTextContent(textareaElement, originalPrompt);
    
    // 重置狀態
    originalPrompt = '';
    isOptimized = false;
    
    // 隱藏還原按鈕
    hideUndoButton();
}

// 顯示還原按鈕
function showUndoButton() {
    if (undoButton) return; // 如果已經存在就不重複創建
    
    const enhanceButton = document.querySelector('.prompt-enhancer-btn');
    if (!enhanceButton) return;
    
    undoButton = createUndoButton();
    
    // 插入到優化按鈕後面
    enhanceButton.parentNode.insertBefore(undoButton, enhanceButton.nextSibling);
}

// 隱藏還原按鈕
function hideUndoButton() {
    if (undoButton && undoButton.parentNode) {
        undoButton.parentNode.removeChild(undoButton);
        undoButton = null;
    }
}

// 處理強化按鈕點擊
async function handleEnhanceClick(event) {
    // 強制阻止所有默認行為和事件冒泡
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const button = event.target.closest('.prompt-enhancer-btn');
    if (!button) return;
    
    // 如果按鈕已經在處理中，直接返回
    if (button.disabled) return;
    
    const originalHTML = button.innerHTML;
    
    try {
        // 獲取設定
        const settings = await chrome.storage.sync.get(['apiKey', 'selectedModel', 'template', 'enableFeasibilityCheck']);
        
        if (!settings.apiKey || !settings.selectedModel || !settings.template) {
            showNotice('請先在擴展設定中配置 API Key、模型和模板', 'error');
            return;
        }
        
        // 獲取當前 prompt
        const siteConfig = getCurrentSiteConfig();
        if (!siteConfig) {
            showNotice('不支援的網站', 'error');
            return;
        }
        
        let textareaElement = document.querySelector(siteConfig.textareaSelector);
        
        // 如果是 ChatGPT 且找不到主要文本區域，嘗試備用選擇器
        if (!textareaElement && siteConfig.name === 'ChatGPT') {
            const backupTextareaSelectors = [
                '#prompt-textarea',
                '[contenteditable="true"]',
                'div[role="textbox"]',
                'textarea',
                '.ProseMirror'
            ];
            
            for (const selector of backupTextareaSelectors) {
                textareaElement = document.querySelector(selector);
                if (textareaElement) {
                    console.log(`Prompt 強化器: 使用備用文本區域選擇器 ${selector}`);
                    break;
                }
            }
        }
        
        if (!textareaElement) {
            showNotice('找不到輸入框，請確保頁面完全載入', 'error');
            return;
        }
        
        const currentPrompt = siteConfig.getTextContent(textareaElement).trim();
        if (!currentPrompt) {
            showNotice('請先輸入 prompt 內容', 'warning');
            return;
        }
        
        if (currentPrompt.length > 4000) {
            showNotice('Prompt 內容過長，請縮短至 4000 字元以內', 'warning');
            return;
        }
        
        // 保存原始 prompt
        originalPrompt = currentPrompt;
        
        // 如果啟用了可行性驗證，先進行驗證
        if (settings.enableFeasibilityCheck) {
            // 更新按鈕狀態 - 顯示可行性檢查
            button.innerHTML = `
                <span class="loading-spinner"></span>
                <span>可行性檢查中...</span>
            `;
            button.disabled = true;
            button.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
            
            try {
                const feasibilityResult = await checkFeasibilityViaBackground(currentPrompt, settings);
                
                showFeasibilityModal(feasibilityResult);
            } catch (error) {
                console.error('可行性檢查失敗:', error);
                showNotice('可行性檢查失敗，將繼續進行優化', 'warning');
            }
        }
        
        // 更新按鈕狀態 - 顯示載入動畫
        button.innerHTML = `
            <span class="loading-spinner"></span>
            <span>處理中...</span>
        `;
        button.disabled = true;
        button.style.background = 'linear-gradient(135deg, #ffa726 0%, #ff7043 100%)';
        
        // 通過 background script 調用 Gemini API
        const enhancedPrompt = await enhancePromptViaBackground(currentPrompt, settings);
        
        // 替換 prompt
        siteConfig.setTextContent(textareaElement, enhancedPrompt);
        
        // 設置優化狀態
        isOptimized = true;
        
        // 顯示還原按鈕
        showUndoButton();
        
        // 恢復按鈕狀態
        button.innerHTML = originalHTML;
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
    } catch (error) {
        console.error('強化 prompt 失敗:', error);
        
        // 錯誤狀態
        button.innerHTML = `
            <span class="btn-icon">❌</span>
            <span class="btn-text">失敗</span>
        `;
        button.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        
        // 根據錯誤類型顯示不同訊息
        let errorMessage = '優化失敗';
        if (error.message.includes('API Key')) {
            errorMessage = 'API Key 無效，請檢查設定';
        } else if (error.message.includes('網路')) {
            errorMessage = '網路連接失敗，請檢查網路';
        } else if (error.message.includes('額度')) {
            errorMessage = 'API 額度不足，請檢查帳戶';
        }
        
        showNotice(errorMessage, 'error');
        
        // 恢復按鈕狀態
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 3000);
    } finally {
        button.disabled = false;
    }
}

// 通過 background script 調用可行性檢查
async function checkFeasibilityViaBackground(originalPrompt, settings) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'checkFeasibility',
            data: {
                originalPrompt,
                apiKey: settings.apiKey,
                selectedModel: settings.selectedModel
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            if (response.success) {
                resolve(response.data);
            } else {
                reject(new Error(response.error));
            }
        });
    });
}

// 顯示可行性結果彈窗（可手動關閉）
function showFeasibilityModal(feasibilityResult) {
    // 創建彈窗
    const modal = document.createElement('div');
    modal.className = 'feasibility-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'feasibility-modal-content';
    
    // 生成難度星星
    const generateStars = (difficulty) => {
        return '★'.repeat(difficulty) + '☆'.repeat(10 - difficulty);
    };
    
    // 生成工具標籤
    const generateToolTags = (tools) => {
        return tools.map(tool => `<span class="tool-tag">${tool}</span>`).join('');
    };
    
    // 生成技術挑戰列表
    const generateChallenges = (challenges) => {
        return challenges.map(challenge => `<li>${challenge}</li>`).join('');
    };
    
    let modalHTML = `
        <button class="close-modal-btn">×</button>
        <h3>可行性評估結果</h3>
    `;
    
    if (!feasibilityResult.isFeasible) {
        modalHTML += `
            <div class="not-feasible">
                <h4>❌ 項目不可行</h4>
                <p>${feasibilityResult.reason}</p>
            </div>
        `;
    } else {
        modalHTML += `
            <div class="feasibility-section">
                <h4>✅ 項目可行</h4>
                ${feasibilityResult.reason ? `<p>${feasibilityResult.reason}</p>` : ''}
            </div>
        `;
    }
    
    modalHTML += `
        <div class="feasibility-section">
            <h4>建議工具</h4>
            <div class="tools-list">
                ${generateToolTags(feasibilityResult.recommendedTools)}
            </div>
        </div>
        
        <div class="feasibility-section">
            <h4>難度評估</h4>
            <p>
                ${feasibilityResult.difficulty}/10
                <span class="difficulty-stars">${generateStars(feasibilityResult.difficulty)}</span>
            </p>
        </div>
        
        <div class="feasibility-section">
            <h4>可能遇到的技術挑戰</h4>
            <ul>
                ${generateChallenges(feasibilityResult.technicalChallenges)}
            </ul>
        </div>
    `;
    
    modalContent.innerHTML = modalHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 綁定關閉按鈕事件
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // 點擊背景可以立即關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    });
    
    // ESC 鍵可以立即關閉
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', handleEscape);
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// 通過 background script 調用 Gemini API 強化 prompt
async function enhancePromptViaBackground(originalPrompt, settings) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'enhancePrompt',
            data: {
                originalPrompt,
                apiKey: settings.apiKey,
                selectedModel: settings.selectedModel,
                template: settings.template
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            if (response.success) {
                resolve(response.data);
            } else {
                reject(new Error(response.error));
            }
        });
    });
}

// 插入強化按鈕
function insertEnhanceButton() {
    const siteConfig = getCurrentSiteConfig();
    if (!siteConfig) {
        console.log('Prompt 強化器: 不支援的網站');
        return;
    }
    
    // 檢查是否已經插入過按鈕
    if (document.querySelector('.prompt-enhancer-btn')) {
        return;
    }
    
    let targetElement = document.querySelector(siteConfig.insertSelector);
    
    // 如果是 ChatGPT 且找不到主要選擇器，嘗試備用選擇器
    if (!targetElement && siteConfig.name === 'ChatGPT') {
        const backupSelectors = [
            // 工具按鈕的各種可能選擇器
            'button[aria-label*="工具"]',
            'button[aria-label*="Tools"]',
            'button[data-testid*="tools"]',
            // 工具欄中的按鈕
            '[role="toolbar"] button:last-child',
            '.flex.items-center button:last-child',
            // 發送按鈕作為最後備選
            'button[data-testid="send-button"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="送出"]'
        ];
        
        for (const selector of backupSelectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) {
                console.log(`Prompt 強化器: 使用備用選擇器 ${selector}`);
                break;
            }
        }
    }
    
    if (!targetElement) {
        console.log(`Prompt 強化器: 在 ${siteConfig.name} 中找不到插入位置`);
        return;
    }
    
    const button = createEnhanceButton();
    
    // 為 ChatGPT 特別處理，確保按鈕插入到工具欄的正確位置
    if (siteConfig.name === 'ChatGPT') {
        // 嘗試找到工具欄容器
        const toolbar = targetElement.closest('[role="toolbar"]') || 
                       targetElement.closest('.flex') || 
                       targetElement.parentElement;
        
        if (toolbar) {
            // 插入到目標元素之前（工具按鈕之前）
            toolbar.insertBefore(button, targetElement);
        } else {
            targetElement.parentNode.insertBefore(button, targetElement);
        }
    } else {
        if (siteConfig.insertPosition === 'after') {
            targetElement.parentNode.insertBefore(button, targetElement.nextSibling);
        } else {
            targetElement.parentNode.insertBefore(button, targetElement);
        }
    }
    
    console.log(`Prompt 強化器: 已在 ${siteConfig.name} 中成功插入按鈕`);
}

// 顯示提示訊息
function showNotice(message, type = 'error') {
    // 移除現有通知
    const existingNotice = document.querySelector('.prompt-enhancer-notice');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    // 圖標映射
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    // 創建新通知
    const notice = document.createElement('div');
    notice.className = `prompt-enhancer-notice ${type}`;
    notice.innerHTML = `
        <span class="prompt-enhancer-notice-icon">${icons[type] || icons.error}</span>
        <span>${message}</span>
    `;
    
    // 添加到頁面
    document.body.appendChild(notice);
    
    // 根據類型設定不同的顯示時間
    const duration = type === 'success' ? 2000 : type === 'info' ? 4000 : 3000;
    
    setTimeout(() => {
        if (notice.parentNode) {
            notice.style.animation = 'slideOutToRight 0.3s ease-in forwards';
            setTimeout(() => notice.remove(), 300);
        }
    }, duration);
}

// 監聽 DOM 變化，支援動態載入的內容
const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldCheck = true;
        }
    });
    
    if (shouldCheck) {
        setTimeout(insertEnhanceButton, 1000);
    }
});

// 快捷鍵處理
function handleKeyboardShortcut(event) {
    // Ctrl+Shift+E (Windows/Linux) 或 Cmd+Shift+E (Mac) - 優化 Prompt
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        
        const button = document.querySelector('.prompt-enhancer-btn');
        if (button && !button.disabled) {
            button.click();
        } else if (!button) {
            showNotice('找不到 Prompt 強化按鈕', 'warning');
        } else {
            showNotice('正在處理中，請稍候...', 'info');
        }
    }
    
    // Ctrl+Shift+Z (Windows/Linux) 或 Cmd+Shift+Z (Mac) - 還原 Prompt
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        
        const undoBtn = document.querySelector('.prompt-undo-btn');
        if (undoBtn) {
            undoBtn.click();
        }
    }
}

// 設置提交監聽器
function setupSubmitListener() {
    const siteConfig = getCurrentSiteConfig();
    if (!siteConfig) return;
    
    // 監聽發送按鈕點擊
    document.addEventListener('click', (event) => {
        const target = event.target;
        
        // 檢查是否點擊了發送按鈕
        let isSubmitButton = false;
        
        if (siteConfig.name === 'ChatGPT') {
            isSubmitButton = target.matches('[data-testid="send-button"]') || 
                           target.closest('[data-testid="send-button"]');
        } else if (siteConfig.name === 'Claude') {
            isSubmitButton = target.matches('button[aria-label*="Send Message"]') || 
                           target.closest('button[aria-label*="Send Message"]');
        } else if (siteConfig.name === 'Gemini') {
            isSubmitButton = target.matches('button[aria-label*="Send message"]') || 
                           target.closest('button[aria-label*="Send message"]');
        }
        
        if (isSubmitButton && isOptimized) {
            // 延遲隱藏還原按鈕，確保消息已發送
            setTimeout(() => {
                hideUndoButton();
                originalPrompt = '';
                isOptimized = false;
            }, 500);
        }
    }, true);
    
    // 監聽 Enter 鍵提交
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey && isOptimized) {
            const textareaElement = document.querySelector(siteConfig.textareaSelector);
            if (textareaElement && document.activeElement === textareaElement) {
                // 延遲隱藏還原按鈕
                setTimeout(() => {
                    hideUndoButton();
                    originalPrompt = '';
                    isOptimized = false;
                }, 500);
            }
        }
    }, true);
}

// 初始化
function initialize() {
    // 立即嘗試插入按鈕
    insertEnhanceButton();
    
    // 延遲插入，因為某些網站需要時間載入
    setTimeout(insertEnhanceButton, 2000);
    setTimeout(insertEnhanceButton, 5000);
    
    // 開始監聽 DOM 變化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 添加快捷鍵監聽
    document.addEventListener('keydown', handleKeyboardShortcut);
    
    // 監聽提交事件，隱藏還原按鈕
    setupSubmitListener();
    
    // 顯示歡迎訊息（僅首次）
    chrome.storage.local.get(['firstTime'], (result) => {
        if (!result.firstTime) {
            setTimeout(() => {
                showNotice('Prompt 強化器已啟用！快捷鍵：Ctrl+Shift+E 優化，Ctrl+Shift+Z 還原', 'info');
                chrome.storage.local.set({ firstTime: true });
            }, 2000);
        }
    });
}

// 等待 DOM 完全載入
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 