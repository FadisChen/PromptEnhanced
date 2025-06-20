// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SettingsPanel } from './settingsPanel';
import { OptimizerPanel } from './optimizerPanel';
import { WelcomeProvider } from './welcomeProvider';
import { GeminiService } from './geminiService';
import { QuickOptimizeService } from './quickOptimizeService';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('PromptEnhanced 擴充功能已啟動!');

	// 創建歡迎視圖提供者
	const welcomeProvider = new WelcomeProvider();
	vscode.window.registerTreeDataProvider('promptenhanced.welcome', welcomeProvider);

	// 註冊設定面板命令
	const settingsCommand = vscode.commands.registerCommand('promptenhanced.openSettings', () => {
		SettingsPanel.createOrShow(context.extensionUri);
	});

	// 註冊提示詞優化面板命令
	const optimizerCommand = vscode.commands.registerCommand('promptenhanced.openOptimizer', () => {
		OptimizerPanel.createOrShow(context.extensionUri);
	});

	// 註冊檢查配置命令
	const checkConfigCommand = vscode.commands.registerCommand('promptenhanced.checkConfig', () => {
		try {
			const config = vscode.workspace.getConfiguration('promptenhanced');
			const apiKey = config.get('geminiApiKey', '');
			const modelId = config.get('geminiModelId', '');
			
			if (apiKey.trim() && modelId.trim()) {
				vscode.window.showInformationMessage('✅ 配置完整！API Key 和 Model ID 已設定。');
			} else {
				vscode.window.showWarningMessage('⚠️ 配置不完整！請在設定面板中配置 API Key 和 Model ID。', '開啟設定')
					.then(selection => {
						if (selection === '開啟設定') {
							vscode.commands.executeCommand('promptenhanced.openSettings');
						}
					});
			}
		} catch (error) {
			console.error('檢查配置時發生錯誤:', error);
			vscode.window.showErrorMessage('無法檢查配置，請確保 VS Code 工作區已正確載入。');
		}
	});

	// 註冊測試命令
	const testShortcutCommand = vscode.commands.registerCommand('promptenhanced.testShortcut', () => {
		vscode.window.showInformationMessage('🎉 PromptEnhanced 擴展正常運作！快捷鍵 Alt+P 應該可以使用。');
	});

	// 創建快速優化服務
	const quickOptimizeService = new QuickOptimizeService();

	// 註冊快速優化命令 (Alt+P)
	const quickOptimizeCommand = vscode.commands.registerCommand('promptenhanced.quickOptimize', async () => {
		console.log('🚀 PromptEnhanced: 快速優化命令被觸發');
		
		// 檢查配置是否完整
		try {
			const config = vscode.workspace.getConfiguration('promptenhanced');
			const apiKey = config.get('geminiApiKey', '');
			const modelId = config.get('geminiModelId', '');
			
			if (!apiKey.trim() || !modelId.trim()) {
				const result = await vscode.window.showWarningMessage(
					'⚠️ 請先配置 API Key 和 Model ID 才能使用快速優化功能',
					'開啟設定'
				);
				if (result === '開啟設定') {
					vscode.commands.executeCommand('promptenhanced.openSettings');
				}
				return;
			}
		} catch (configError) {
			console.error('無法訪問工作區配置:', configError);
			vscode.window.showErrorMessage('無法訪問配置，請確保在正確的工作區中使用此功能。');
			return;
		}

		// 使用新的快速優化服務
		await quickOptimizeService.optimizeCurrentContent();
	});

	context.subscriptions.push(settingsCommand, optimizerCommand, checkConfigCommand, quickOptimizeCommand, testShortcutCommand);

	// 監聽配置變更
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('promptenhanced')) {
				// 通知所有面板配置已更新
				SettingsPanel.notifyConfigurationChanged();
				OptimizerPanel.notifyConfigurationChanged();
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	SettingsPanel.dispose();
	OptimizerPanel.dispose();
}
