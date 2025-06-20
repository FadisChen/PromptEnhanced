import * as vscode from 'vscode';

export class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<QuickActionItem | undefined | null | void> = new vscode.EventEmitter<QuickActionItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<QuickActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor() {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: QuickActionItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]> {
		if (!element) {
			// 根級別項目
			return Promise.resolve([
				new QuickActionItem(
					'⚙️ 開啟設定面板',
					'配置 Gemini API Key 和其他設定',
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'promptenhanced.openSettings',
						title: '開啟設定面板'
					}
				),
				new QuickActionItem(
					'✨ 開啟優化面板',
					'開始優化您的提示詞',
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'promptenhanced.openOptimizer',
						title: '開啟優化面板'
					}
				),
				new QuickActionItem(
					'📋 檢查配置狀態',
					'檢查 API 配置是否完整',
					vscode.TreeItemCollapsibleState.None,
					{
						command: 'promptenhanced.checkConfig',
						title: '檢查配置'
					}
				)
			]);
		}
		return Promise.resolve([]);
	}
}

export class QuickActionItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly tooltip: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = tooltip;
		this.command = command;
		
		// 根據標籤設定圖示
		if (label.includes('設定')) {
			this.iconPath = new vscode.ThemeIcon('gear');
		} else if (label.includes('優化')) {
			this.iconPath = new vscode.ThemeIcon('sparkle');
		} else if (label.includes('檢查')) {
			this.iconPath = new vscode.ThemeIcon('checklist');
		}
	}
} 