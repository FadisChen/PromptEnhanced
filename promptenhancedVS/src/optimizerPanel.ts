import * as vscode from 'vscode';
import { GeminiService } from './geminiService';

export class OptimizerPanel {
	public static currentPanel: OptimizerPanel | undefined;
	public static readonly viewType = 'promptenhanced.optimizer';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _geminiService: GeminiService;
	private _disposables: vscode.Disposable[] = [];
	private _originalPrompt: string = '';

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// 如果已經有面板，則顯示它
		if (OptimizerPanel.currentPanel) {
			OptimizerPanel.currentPanel._panel.reveal(column);
			return;
		}

		// 否則創建新面板
		const panel = vscode.window.createWebviewPanel(
			OptimizerPanel.viewType,
			'✨ 提示詞優化面板',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		OptimizerPanel.currentPanel = new OptimizerPanel(panel, extensionUri);
	}

	public static notifyConfigurationChanged() {
		if (OptimizerPanel.currentPanel) {
			OptimizerPanel.currentPanel._updateWebview();
		}
	}

	public static dispose() {
		if (OptimizerPanel.currentPanel) {
			OptimizerPanel.currentPanel._panel.dispose();
			OptimizerPanel.currentPanel = undefined;
		}
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._geminiService = new GeminiService();

		// 設定初始內容
		this._updateWebview();

		// 監聽面板被關閉事件
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// 處理來自webview的訊息
		this._panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'optimizePrompt':
						await this._optimizePrompt(message.prompt);
						return;
					case 'restoreOriginal':
						this._restoreOriginalPrompt();
						return;
					case 'checkConfiguration':
						this._checkConfiguration();
						return;
					case 'openSettings':
						vscode.commands.executeCommand('promptenhanced.openSettings');
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		OptimizerPanel.currentPanel = undefined;

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
	}

	private async _optimizePrompt(prompt: string) {
		if (!prompt.trim()) {
			vscode.window.showWarningMessage('請輸入提示詞內容');
			return;
		}

		// 儲存原始提示詞
		this._originalPrompt = prompt;

		// 顯示載入狀態
		this._panel.webview.postMessage({
			command: 'showLoading',
			message: '正在優化提示詞...'
		});

		try {
			const optimizedPrompt = await this._geminiService.optimizePrompt(prompt);
			
			// 顯示優化結果
			this._panel.webview.postMessage({
				command: 'showOptimizedResult',
				result: optimizedPrompt,
				showRestore: true
			});

		} catch (error) {
			// 隱藏載入狀態
			this._panel.webview.postMessage({
				command: 'hideLoading'
			});

			const errorMessage = error instanceof Error ? error.message : '未知錯誤';
			vscode.window.showErrorMessage(`優化失敗: ${errorMessage}`);
		}
	}

	private _restoreOriginalPrompt() {
		this._panel.webview.postMessage({
			command: 'restorePrompt',
			originalPrompt: this._originalPrompt
		});
	}

	private _checkConfiguration() {
		const config = vscode.workspace.getConfiguration('promptenhanced');
		const apiKey = config.get('geminiApiKey', '');
		const modelId = config.get('geminiModelId', '');

		const isConfigured = apiKey.trim() !== '' && modelId.trim() !== '';

		this._panel.webview.postMessage({
			command: 'configurationStatus',
			isConfigured: isConfigured,
			message: isConfigured ? '配置完成' : '請先在設定面板中配置 API Key 和 Model ID'
		});
	}

	private _getHtmlForWebview(): string {
		return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>提示詞優化面板</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .title {
            font-size: 24px;
            margin-bottom: 20px;
            color: var(--vscode-editor-foreground);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: var(--vscode-input-foreground);
        }
        textarea {
            width: 100%;
            min-height: 200px;
            padding: 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            resize: vertical;
            box-sizing: border-box;
        }
        .button-group {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 20px;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .loading {
            display: none;
            align-items: center;
            gap: 10px;
            color: var(--vscode-progressBar-background);
        }
        .loading.show {
            display: flex;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--vscode-progressBar-background);
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .status-bar {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
        }
        .status-bar.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            display: block;
        }
        .status-bar.warning {
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            display: block;
        }
        .status-bar.success {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-inputValidation-infoForeground);
            display: block;
        }
        .settings-link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
        }
        .settings-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">✨ 提示詞優化面板</h1>
        
        <div id="statusBar" class="status-bar">
            <span id="statusMessage"></span>
        </div>

        <div class="form-group">
            <label for="promptInput">請輸入您的提示詞：</label>
            <textarea id="promptInput" placeholder="在此輸入您想要優化的提示詞..."></textarea>
        </div>

        <div class="button-group">
            <button id="optimizeBtn" class="button" onclick="optimizePrompt()">
                🚀 優化提示詞
            </button>
            <button id="restoreBtn" class="button secondary" onclick="restoreOriginal()" style="display: none;">
                ↩️ 還原原始提示詞
            </button>
            <button id="settingsBtn" class="button secondary" onclick="openSettings()">
                ⚙️ 設定
            </button>
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <span id="loadingMessage">處理中...</span>
            </div>
        </div>

        <div class="form-group">
            <p>💡 提示：請先在 <a href="#" class="settings-link" onclick="openSettings()">⚙️ 設定面板</a> 中配置您的 Gemini API Key 和 Model ID。</p>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // 優化提示詞
        function optimizePrompt() {
            const prompt = document.getElementById('promptInput').value;
            if (!prompt.trim()) {
                showStatus('請輸入提示詞內容', 'warning');
                return;
            }

            vscode.postMessage({
                command: 'optimizePrompt',
                prompt: prompt
            });
        }

        // 還原原始提示詞
        function restoreOriginal() {
            vscode.postMessage({
                command: 'restoreOriginal'
            });
        }

        // 開啟設定面板
        function openSettings() {
            vscode.postMessage({
                command: 'openSettings'
            });
        }

        // 顯示狀態訊息
        function showStatus(message, type = 'info') {
            const statusBar = document.getElementById('statusBar');
            const statusMessage = document.getElementById('statusMessage');
            
            statusBar.className = \`status-bar \${type}\`;
            statusMessage.textContent = message;
            
            if (type !== 'error' && type !== 'warning') {
                setTimeout(() => {
                    statusBar.style.display = 'none';
                }, 3000);
            }
        }

        // 監聽來自擴充功能的訊息
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'showLoading':
                    document.getElementById('loading').classList.add('show');
                    document.getElementById('loadingMessage').textContent = message.message;
                    document.getElementById('optimizeBtn').disabled = true;
                    break;

                case 'hideLoading':
                    document.getElementById('loading').classList.remove('show');
                    document.getElementById('optimizeBtn').disabled = false;
                    break;

                case 'showOptimizedResult':
                    document.getElementById('loading').classList.remove('show');
                    document.getElementById('optimizeBtn').disabled = false;
                    document.getElementById('promptInput').value = message.result;
                    if (message.showRestore) {
                        document.getElementById('restoreBtn').style.display = 'inline-flex';
                    }
                    showStatus('提示詞優化完成！', 'success');
                    break;

                case 'restorePrompt':
                    document.getElementById('promptInput').value = message.originalPrompt;
                    document.getElementById('restoreBtn').style.display = 'none';
                    showStatus('已還原原始提示詞', 'success');
                    break;

                case 'configurationStatus':
                    if (!message.isConfigured) {
                        showStatus(message.message, 'warning');
                    }
                    break;
            }
        });

        // 頁面載入時檢查配置
        vscode.postMessage({
            command: 'checkConfiguration'
        });
    </script>
</body>
</html>`;
	}
} 