# ✨ Prompt 強化器

一個 Chrome 擴展程式，在 ChatGPT、Claude 和 Gemini 中提供 AI 驅動的 prompt 優化功能。

## 功能特色

- 🎯 **多平台支援**: 支援 ChatGPT、Claude 和 Gemini
- 🤖 **AI 驅動**: 使用 Gemini API 進行 prompt 優化
- ✅ **可行性驗證**: 在優化前，可選用 Gemini AI 對原始 prompt 進行項目可行性評估，提供建議工具、難度評分（1-10 顆星）及潛在技術挑戰。
- ⚡ **一鍵優化**: 點擊按鈕或使用快捷鍵即可優化 prompt
- 🎨 **自定義模板**: 可自定義優化模板
- 💾 **設定同步**: 設定在所有網站間共用
- ⌨️ **快捷鍵支援**: Ctrl+Shift+E 優化，Ctrl+Shift+Z 還原
- 🎨 **美觀介面**: 現代化設計，載入動畫、狀態提示與還原按鈕
- 🔧 **即時還原**: 優化後可立即還原至原始 Prompt

## 安裝步驟

### 1. 下載擴展程式
下載所有文件到本地文件夾

### 2. 安裝擴展程式
1. 開啟 Chrome 瀏覽器
2. 輸入 `chrome://extensions/` 進入擴展程式管理頁面
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇包含擴展程式文件的文件夾

### 3. 設定 API Key
1. 點擊擴展程式圖標
2. 輸入您的 Gemini API Key
3. 點擊「測試 API Key」
4. 選擇要使用的 Gemini 模型 (已自動過濾出包含 'gemini' 和 'flash' 且排除 1.5 和 Lite 版本的模型)
5. 確認強化模板（或自定義）
6. 勾選「啟用可行性驗證」可啟用此功能（可選）
7. 點擊「儲存設定」

## 使用方法

1. 訪問 [ChatGPT](https://chatgpt.com/)、[Claude](https://claude.ai/) 或 [Gemini](https://gemini.google.com/)
2. 在輸入框中輸入您的 prompt
3. 點擊 **優化** 按鈕或使用快捷鍵 `Ctrl+Shift+E`
4. 如果啟用可行性驗證，會先彈出評估結果（包含可行性、建議工具、難度、技術挑戰等），彈窗會自動消失或可手動關閉，然後自動繼續優化。
5. 等待 AI 優化您的 prompt（會顯示載入動畫）
6. 優化後的 prompt 將自動替換原始內容
7. 如果需要，點擊 **還原** 按鈕或使用快捷鍵 `Ctrl+Shift+Z`，即可還原到優化前的 Prompt。
8. 還原按鈕會在您提交優化後的 Prompt 或手動還原後自動隱藏。

## 支援的網站

- **ChatGPT** (`https://chatgpt.com/`)
- **Claude** (`https://claude.ai/`)
- **Gemini** (`https://gemini.google.com/`)

## 獲取 Gemini API Key

1. 訪問 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 點擊「Create API Key」
3. 選擇您的 Google Cloud 項目
4. 複製生成的 API Key
5. 在擴展程式設定中貼上

## 故障排除

### 按鈕沒有出現
- 確認頁面完全載入
- 檢查是否在支援的網站上
- 重新整理頁面

### API 調用失敗
- 檢查 API Key 是否正確
- 確認網路連接正常
- 檢查 Gemini API 額度

### 優化效果不佳
- 調整優化模板
- 嘗試不同的 Gemini 模型
- 確保原始 prompt 足夠清楚

## 注意事項

⚠️ **網站更新**: 如果目標網站更新了其界面，按鈕可能無法正常顯示。

## 技術細節

- **Manifest Version**: 3
- **權限**: activeTab, 指定網站訪問權限
- **API**: Gemini API v1beta
- **語言**: JavaScript (ES6+), HTML5, CSS3

## 開發

如需修改或擴展功能，請編輯對應的文件：
- `manifest.json`: 擴展程式配置
- `popup.html/js/css`: 設定界面
- `content.js/css`: 內容腳本 (包含優化和還原按鈕邏輯)
- `background.js`: 背景腳本 (處理 API 調用)

## 授權

此項目為個人開發，僅供學習和個人使用。 
