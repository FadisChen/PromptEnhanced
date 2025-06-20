import * as vscode from 'vscode';

export class SettingsPanel {
	public static currentPanel: SettingsPanel | undefined;
	public static readonly viewType = 'promptenhanced.settings';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// 如果已經有面板，則顯示它
		if (SettingsPanel.currentPanel) {
			SettingsPanel.currentPanel._panel.reveal(column);
			return;
		}

		// 否則創建新面板
		const panel = vscode.window.createWebviewPanel(
			SettingsPanel.viewType,
			'⚙️ PromptEnhanced 設定',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		SettingsPanel.currentPanel = new SettingsPanel(panel, extensionUri);
	}

	public static notifyConfigurationChanged() {
		if (SettingsPanel.currentPanel) {
			SettingsPanel.currentPanel._updateWebview();
		}
	}

	public static dispose() {
		if (SettingsPanel.currentPanel) {
			SettingsPanel.currentPanel._panel.dispose();
			SettingsPanel.currentPanel = undefined;
		}
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// 設定初始內容
		this._updateWebview();

		// 監聽面板被關閉事件
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// 處理來自webview的訊息
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'saveSettings':
						this._saveSettings(message.settings);
						return;
					case 'loadSettings':
						this._loadSettings();
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		SettingsPanel.currentPanel = undefined;

		// 清理資源
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _updateWebview() {
		this._panel.webview.html = this._getHtmlForWebview();
		this._loadSettings();
	}

	private _saveSettings(settings: any) {
		const config = vscode.workspace.getConfiguration('promptenhanced');
		
		Promise.all([
			config.update('geminiApiKey', settings.geminiApiKey, vscode.ConfigurationTarget.Global),
			config.update('geminiModelId', settings.geminiModelId, vscode.ConfigurationTarget.Global),
			config.update('enhancementTemplate', settings.enhancementTemplate, vscode.ConfigurationTarget.Global),
			config.update('translateToEnglish', settings.translateToEnglish, vscode.ConfigurationTarget.Global)
		]).then(() => {
			vscode.window.showInformationMessage('設定已儲存！');
		}).catch(error => {
			vscode.window.showErrorMessage(`儲存設定失敗: ${error.message}`);
		});
	}

	private _loadSettings() {
		const config = vscode.workspace.getConfiguration('promptenhanced');
		const settings = {
			geminiApiKey: config.get('geminiApiKey', ''),
			geminiModelId: config.get('geminiModelId', 'gemini-2.0-flash-exp'),
			enhancementTemplate: config.get('enhancementTemplate', '請優化以下提示詞，使其更清晰、具體且有效：\n\n{{prompt}}'),
			translateToEnglish: config.get('translateToEnglish', false)
		};

		this._panel.webview.postMessage({
			command: 'loadedSettings',
			settings: settings
		});
	}

	private _getHtmlForWebview(): string {
		return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptEnhanced 設定</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: var(--vscode-input-foreground);
        }
        input[type="text"], textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: inherit;
            box-sizing: border-box;
        }
        textarea {
            height: 100px;
            resize: vertical;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        input[type="checkbox"] {
            width: auto;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        .title {
            font-size: 24px;
            margin-bottom: 20px;
            color: var(--vscode-editor-foreground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">⚙️ PromptEnhanced 設定</h1>
        
        <div class="form-group">
            <label for="geminiApiKey">Gemini API Key</label>
            <input type="text" id="geminiApiKey" placeholder="請輸入您的 Gemini API Key">
            <div class="description">用於驗證 Gemini API 請求的密鑰</div>
        </div>

        <div class="form-group">
            <label for="geminiModelId">Gemini Model ID</label>
            <input type="text" id="geminiModelId" placeholder="gemini-2.0-flash-exp">
            <div class="description">指定要使用的 Gemini 模型識別符</div>
        </div>

        <div class="form-group">
            <label for="enhancementTemplate">提示詞強化模板</label>
            <textarea id="enhancementTemplate" placeholder="請輸入提示詞強化模板，使用 {{prompt}} 作為佔位符"></textarea>
            <div class="description">將在提交給 Gemini 前自動預先附加至使用者輸入的提示詞。使用 {{prompt}} 作為使用者提示詞的佔位符。</div>
        </div>

        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="translateToEnglish">
                <label for="translateToEnglish">自動翻譯為英文</label>
            </div>
            <div class="description">啟用後，會在提示詞中要求 Gemini 以英文返回結果</div>
        </div>

        <div class="form-group">
            <button class="button" onclick="saveSettings()">儲存設定</button>
            <button class="button secondary" onclick="loadSettings()">重新載入</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // 載入設定
        function loadSettings() {
            vscode.postMessage({
                command: 'loadSettings'
            });
        }

        // 儲存設定
        function saveSettings() {
            const settings = {
                geminiApiKey: document.getElementById('geminiApiKey').value,
                geminiModelId: document.getElementById('geminiModelId').value,
                enhancementTemplate: document.getElementById('enhancementTemplate').value,
                translateToEnglish: document.getElementById('translateToEnglish').checked
            };

            vscode.postMessage({
                command: 'saveSettings',
                settings: settings
            });
        }

        // 監聽來自擴充功能的訊息
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadedSettings':
                    const settings = message.settings;
                    document.getElementById('geminiApiKey').value = settings.geminiApiKey || '';
                    document.getElementById('geminiModelId').value = settings.geminiModelId || 'gemini-2.0-flash-exp';
                    document.getElementById('enhancementTemplate').value = settings.enhancementTemplate || '';
                    document.getElementById('translateToEnglish').checked = settings.translateToEnglish || false;
                    break;
            }
        });

        // 頁面載入時載入設定
        loadSettings();
    </script>
</body>
</html>`;
	}
} 