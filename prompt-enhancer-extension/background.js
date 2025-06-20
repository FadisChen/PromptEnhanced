// Background script 處理 API 調用
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enhancePrompt') {
        enhancePromptWithGemini(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 表示將異步發送回應
    } else if (request.action === 'checkFeasibility') {
        checkFeasibilityWithGemini(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 表示將異步發送回應
    }
});

// 調用 Gemini API 強化 prompt
async function enhancePromptWithGemini({ originalPrompt, apiKey, selectedModel, template }) {
    // 替換模板中的佔位符
    const enhancedTemplate = template.replace(/\{\{prompt\}\}/g, originalPrompt);
    
    const requestBody = {
        contents: [{
            parts: [{
                text: enhancedTemplate
            }]
        }],
        generationConfig: {
            temperature: 0.7,
        }
    };
    
    // 創建 AbortController 用於超時控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 錯誤回應:', errorText);
            
            if (response.status === 401) {
                throw new Error('無效的 Gemini API Key');
            } else if (response.status === 403) {
                throw new Error('API Key 權限不足或已超出額度');
            } else if (response.status === 429) {
                throw new Error('API 調用頻率過高，請稍後再試');
            } else {
                throw new Error(`API 調用失敗 (${response.status}): ${errorText}`);
            }
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('API 回應結構異常:', data);
            throw new Error('API 返回無效的回應');
        }
        
        return data.candidates[0].content.parts[0].text;
        
    } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('網路請求錯誤:', fetchError);
        
        if (fetchError.name === 'AbortError') {
            throw new Error('請求超時，請稍後再試');
        } else if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('網路連接失敗，請檢查網路連接或防火牆設定');
        } else if (fetchError.name === 'TypeError') {
            throw new Error('網路請求被阻止，可能是 CORS 限制');
        } else {
            throw fetchError;
        }
    }
}

// 調用 Gemini API 進行可行性驗證
async function checkFeasibilityWithGemini({ originalPrompt, apiKey, selectedModel }) {
    const feasibilityTemplate = `你是一個專業的技術顧問和項目評估專家。請分析以下用戶需求的可行性：

用戶需求：${originalPrompt}

評估標準：
1. 技術可行性：是否能用現有技術實現
2. 複雜度：實現難度如何
3. 資源需求：需要什麼工具和技能
4. 時間估算：大概需要多長時間

請根據以下要求進行評估：
- isFeasible: 判斷項目是否可行（true/false）
- reason: 如果不可行，請使用繁體中文說明原因；如果可行，可以留空
- recommendedTools: 從以下選項中選擇合適的工具：Github copilot, v0.dev, bolt.new, ChatGPT, stitch, Replit Agent
- difficulty: 難度評分（1-10，1最簡單，10最困難）
- technicalChallenges: 使用繁體中文列出可能遇到的技術挑戰`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: feasibilityTemplate
            }]
        }],
        generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    isFeasible: {
                        type: "BOOLEAN"
                    },
                    reason: {
                        type: "STRING"
                    },
                    recommendedTools: {
                        type: "ARRAY",
                        items: {
                            type: "STRING"
                        }
                    },
                    difficulty: {
                        type: "INTEGER",
                        minimum: 1,
                        maximum: 10
                    },
                    technicalChallenges: {
                        type: "ARRAY",
                        items: {
                            type: "STRING"
                        }
                    }
                },
                required: ["isFeasible", "reason", "recommendedTools", "difficulty", "technicalChallenges"]
            }
        }
    };
    
    // 創建 AbortController 用於超時控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 錯誤回應:', errorText);
            
            if (response.status === 401) {
                throw new Error('無效的 Gemini API Key');
            } else if (response.status === 403) {
                throw new Error('API Key 權限不足或已超出額度');
            } else if (response.status === 429) {
                throw new Error('API 調用頻率過高，請稍後再試');
            } else {
                throw new Error(`API 調用失敗 (${response.status}): ${errorText}`);
            }
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('API 回應結構異常:', data);
            throw new Error('API 返回無效的回應');
        }
        
        const responseText = data.candidates[0].content.parts[0].text;
        
        // 由於使用了結構化輸出，responseText 應該已經是有效的 JSON
        try {
            const feasibilityResult = JSON.parse(responseText);
            
            // 驗證和清理數據
            return {
                isFeasible: Boolean(feasibilityResult.isFeasible),
                reason: String(feasibilityResult.reason || ""),
                recommendedTools: Array.isArray(feasibilityResult.recommendedTools) ? 
                    feasibilityResult.recommendedTools : ["ChatGPT"],
                difficulty: Math.max(1, Math.min(10, Number(feasibilityResult.difficulty) || 5)),
                technicalChallenges: Array.isArray(feasibilityResult.technicalChallenges) ? 
                    feasibilityResult.technicalChallenges : ["需要進一步分析技術需求"]
            };
        } catch (parseError) {
            console.error('解析可行性結果失敗:', parseError, '原始回應:', responseText);
            // 如果JSON解析失敗，返回一個默認結果
            return {
                isFeasible: true,
                reason: "無法解析可行性分析結果，建議手動評估",
                recommendedTools: ["ChatGPT"],
                difficulty: 5,
                technicalChallenges: ["需要進一步分析技術需求"]
            };
        }
        
    } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('網路請求錯誤:', fetchError);
        
        if (fetchError.name === 'AbortError') {
            throw new Error('請求超時，請稍後再試');
        } else if (fetchError.message.includes('Failed to fetch')) {
            throw new Error('網路連接失敗，請檢查網路連接或防火牆設定');
        } else if (fetchError.name === 'TypeError') {
            throw new Error('網路請求被阻止，可能是 CORS 限制');
        } else {
            throw fetchError;
        }
    }
} 