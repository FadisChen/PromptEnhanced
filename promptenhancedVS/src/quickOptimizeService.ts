import * as vscode from 'vscode';
import { GeminiService } from './geminiService';

export class QuickOptimizeService {
    private geminiService: GeminiService;

    constructor() {
        this.geminiService = new GeminiService();
    }

    /**
     * 快速優化當前編輯器或聊天輸入框中的內容
     * 增強版本，更好地支援 Cursor IDE
     */
    async optimizeCurrentContent(): Promise<void> {
        try {
            console.log('🚀 QuickOptimizeService: 開始快速優化 (Cursor 兼容模式)');

            // 檢測當前環境
            const activeEditor = vscode.window.activeTextEditor;
            console.log('📍 當前編輯器狀態:', activeEditor ? '有活動編輯器' : '無活動編輯器');

            // 方法 1: 嘗試標準的編輯器操作
            let originalText = await this.tryStandardEditorOperation();
            
            // 方法 2: 如果方法 1 失敗，嘗試替代方案
            if (!originalText) {
                originalText = await this.tryAlternativeOperation();
            }

            // 如果仍然沒有內容，顯示提示
            if (!originalText || !originalText.trim()) {
                vscode.window.showWarningMessage('📝 無法獲取內容。請確保：\n1. 有選中的文字，或\n2. 游標在有內容的編輯器中');
                return;
            }

            console.log('📝 獲取到內容，長度:', originalText.length);

            // 使用 Gemini 服務優化內容
            const optimizedText = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '🚀 正在優化內容...',
                cancellable: false
            }, async () => {
                return await this.geminiService.optimizePrompt(originalText);
            });

            console.log('✅ 優化完成，內容長度:', optimizedText.length);

            // 嘗試替換內容
            const success = await this.replaceContent(optimizedText);
            
            if (success) {
                vscode.window.showInformationMessage('✅ 內容優化完成！');
            } else {
                // 如果無法直接替換，將優化結果複製到剪貼簿
                await vscode.env.clipboard.writeText(optimizedText);
                vscode.window.showInformationMessage('✅ 優化完成！結果已複製到剪貼簿，請手動貼上 (Ctrl+V)');
            }

        } catch (error) {
            console.error('❌ 快速優化錯誤:', error);
            const errorMessage = error instanceof Error ? error.message : '未知錯誤';
            vscode.window.showErrorMessage(`❌ 優化失敗: ${errorMessage}`);
        }
    }

    /**
     * 嘗試標準的編輯器操作
     */
    private async tryStandardEditorOperation(): Promise<string> {
        try {
            // 1. 先嘗試獲取選中的文字
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && !activeEditor.selection.isEmpty) {
                const selectedText = activeEditor.document.getText(activeEditor.selection);
                if (selectedText.trim()) {
                    console.log('📝 使用選中的文字');
                    return selectedText;
                }
            }

            // 2. 如果沒有選中文字，嘗試全選然後複製
            await vscode.commands.executeCommand('editor.action.selectAll');
            await new Promise(resolve => setTimeout(resolve, 50));
            
            await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
            await new Promise(resolve => setTimeout(resolve, 100));

            const clipboardText = await vscode.env.clipboard.readText();
            console.log('📋 從剪貼簿獲取內容');
            return clipboardText;

        } catch (error) {
            console.warn('⚠️ 標準編輯器操作失敗:', error);
            return '';
        }
    }

    /**
     * 嘗試替代操作方案
     */
    private async tryAlternativeOperation(): Promise<string> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                // 嘗試獲取整個文檔內容
                const documentText = activeEditor.document.getText();
                if (documentText.trim()) {
                    console.log('📄 使用整個文檔內容');
                    return documentText;
                }
            }

            // 最後嘗試從剪貼簿獲取
            const clipboardText = await vscode.env.clipboard.readText();
            if (clipboardText.trim()) {
                console.log('📋 使用剪貼簿現有內容');
                return clipboardText;
            }

            return '';
        } catch (error) {
            console.warn('⚠️ 替代操作方案失敗:', error);
            return '';
        }
    }

    /**
     * 嘗試替換內容
     */
    private async replaceContent(newText: string): Promise<boolean> {
        try {
            // 方法 1: 嘗試直接編輯器替換
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const success = await activeEditor.edit(editBuilder => {
                    const fullRange = new vscode.Range(
                        activeEditor.document.positionAt(0),
                        activeEditor.document.positionAt(activeEditor.document.getText().length)
                    );
                    editBuilder.replace(fullRange, newText);
                });
                
                if (success) {
                    console.log('✅ 直接編輯器替換成功');
                    return true;
                }
            }

            // 方法 2: 嘗試剪貼簿方式
            await vscode.env.clipboard.writeText(newText);
            await vscode.commands.executeCommand('editor.action.selectAll');
            await new Promise(resolve => setTimeout(resolve, 50));
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            
            console.log('✅ 剪貼簿替換完成');
            return true;

        } catch (error) {
            console.warn('⚠️ 內容替換失敗:', error);
            return false;
        }
    }

    /**
     * 檢查是否可以執行快速優化
     */
    canOptimize(): boolean {
        try {
            // 放寬檢查條件，適應 Cursor IDE
            return true;
        } catch (error) {
            console.error('檢查優化條件時發生錯誤:', error);
            return false;
        }
    }
} 