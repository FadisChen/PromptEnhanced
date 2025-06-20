import * as vscode from 'vscode';

interface GeminiRequest {
	contents: {
		parts: {
			text: string;
		}[];
	}[];
}

interface GeminiResponse {
	candidates: {
		content: {
			parts: {
				text: string;
			}[];
		};
	}[];
}

export class GeminiService {
	private getConfiguration() {
		const config = vscode.workspace.getConfiguration('promptenhanced');
		return {
			apiKey: config.get('geminiApiKey', ''),
			modelId: config.get('geminiModelId', 'gemini-2.0-flash-exp'),
			enhancementTemplate: config.get('enhancementTemplate', '請優化以下提示詞，使其更清晰、具體且有效：\n\n{{prompt}}'),
			translateToEnglish: config.get('translateToEnglish', false)
		};
	}

	private validateConfiguration() {
		const config = this.getConfiguration();
		
		if (!config.apiKey.trim()) {
			throw new Error('請在設定中配置 Gemini API Key');
		}

		if (!config.modelId.trim()) {
			throw new Error('請在設定中配置 Gemini Model ID');
		}

		return config;
	}

	private buildOptimizationPrompt(originalPrompt: string): string {
		const config = this.getConfiguration();
		
		// 替換模板中的佔位符
		let enhancedPrompt = config.enhancementTemplate.replace('{{prompt}}', originalPrompt);
		
		// 根據翻譯設定添加語言指示
		if (config.translateToEnglish) {
			enhancedPrompt += '\n\n請以英文回應。Please respond in English.';
		} else {
			enhancedPrompt += '\n\n請以繁體中文回應。Please respond in Traditional Chinese.';
		}

		return enhancedPrompt;
	}

	public async optimizePrompt(originalPrompt: string): Promise<string> {
		const config = this.validateConfiguration();
		
		// 建構優化提示詞
		const optimizationPrompt = this.buildOptimizationPrompt(originalPrompt);
		
		// 準備API請求
		const requestBody: GeminiRequest = {
			contents: [
				{
					parts: [
						{
							text: optimizationPrompt
						}
					]
				}
			]
		};

		// 建構API URL
		const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey}`;

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API 請求失敗 (${response.status}): ${errorText}`);
			}

			const data = await response.json() as GeminiResponse;

			// 檢查回應格式
			if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
				throw new Error('API 回應格式異常');
			}

			const optimizedText = data.candidates[0].content.parts[0].text;
			
			if (!optimizedText || optimizedText.trim() === '') {
				throw new Error('API 回應內容為空');
			}

			return optimizedText.trim();

		} catch (error) {
			if (error instanceof Error) {
				// 處理常見錯誤
				if (error.message.includes('fetch')) {
					throw new Error('網路連線失敗，請檢查網路連線');
				} else if (error.message.includes('401')) {
					throw new Error('API Key 無效，請檢查設定');
				} else if (error.message.includes('403')) {
					throw new Error('API 存取被拒絕，請檢查 API Key 權限');
				} else if (error.message.includes('429')) {
					throw new Error('API 請求過於頻繁，請稍後再試');
				} else if (error.message.includes('500')) {
					throw new Error('Gemini 服務暫時不可用，請稍後再試');
				}
				throw error;
			} else {
				throw new Error('未知錯誤');
			}
		}
	}

	public async testConnection(): Promise<boolean> {
		try {
			await this.optimizePrompt('測試連線');
			return true;
		} catch (error) {
			return false;
		}
	}
} 