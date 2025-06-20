import * as vscode from 'vscode';

export class WelcomeProvider implements vscode.TreeDataProvider<WelcomeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<WelcomeItem | undefined | null | void> = new vscode.EventEmitter<WelcomeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<WelcomeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor() {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: WelcomeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: WelcomeItem): Thenable<WelcomeItem[]> {
		if (!element) {
			return Promise.resolve([
				new WelcomeItem(
					'🚀 點擊上方按鈕開始使用',
					'使用工具列按鈕快速啟動功能',
					vscode.TreeItemCollapsibleState.None
				),
				new WelcomeItem(
					'⚙️ 首次使用請先設定 API Key',
					'在設定面板中配置 Gemini API Key',
					vscode.TreeItemCollapsibleState.None
				),
				new WelcomeItem(
					'✨ 開始優化您的提示詞',
					'在優化面板中輸入並優化提示詞',
					vscode.TreeItemCollapsibleState.None
				)
			]);
		}
		return Promise.resolve([]);
	}
}

export class WelcomeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly tooltip: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.tooltip = tooltip;
		
		// 設定圖示
		if (label.includes('設定')) {
			this.iconPath = new vscode.ThemeIcon('gear');
		} else if (label.includes('優化')) {
			this.iconPath = new vscode.ThemeIcon('sparkle');
		} else if (label.includes('點擊')) {
			this.iconPath = new vscode.ThemeIcon('rocket');
		}
	}
} 