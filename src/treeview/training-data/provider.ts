import * as vscode from 'vscode'
import {TrainingDataParser, Training} from './bxb-parser'

export class TrainingDataProvider implements vscode.TreeDataProvider<TrainingItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TrainingItem | undefined> = new vscode.EventEmitter<TrainingItem | undefined>()
	readonly onDidChangeTreeData: vscode.Event<TrainingItem | undefined> = this._onDidChangeTreeData.event

	constructor(
		private workspaceRoot: string
	) {
	}

	private parser = new TrainingDataParser(this.workspaceRoot)

	refresh(): void {
		this._onDidChangeTreeData.fire()
	}

	getTreeItem(element: TrainingItem): vscode.TreeItem {
		return element
	}

	getChildren(element?: TrainingItem): Thenable<TrainingItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No training data in empty workspace')
			return Promise.resolve([])
		}
		if (!element) {
			return new Promise(resolve=>{
				const targets = this.parser.getTargetList()
				if (targets.length == 0) {
					vscode.window.showInformationMessage('no capsule.bxb file or no target is declared')
				}
				resolve(targets.map(target=>{
					return new TrainingItem(target, vscode.TreeItemCollapsibleState.Collapsed,
						TrainingItemType.Target)
				}))
			})
		} else if (element.type == TrainingItemType.Target) {
			return new Promise(resolve=>{
				const goals: string[] = this.parser.getGoalList(element.label)
				if (goals.length == 0) {
					vscode.window.showInformationMessage('no training data in this target')
				}
				resolve(goals.map(goal=>{
					const count = this.parser.getTrainingList(element.label, goal).length
					return new TrainingItem(goal, vscode.TreeItemCollapsibleState.Collapsed,
						TrainingItemType.Goal, element.label, null, `(${count})`)
				}))
			}) 
		} else if (element.type == TrainingItemType.Goal) {
			return new Promise(resolve=>{
				const trainings: Training[] = this.parser.getTrainingList(element.target, element.label)
				if (trainings.length == 0) {
					vscode.window.showInformationMessage('no training data in this goal')
				}
				resolve(trainings.map(training=>{
					return new TrainingItem(training.utterance, vscode.TreeItemCollapsibleState.None,
						TrainingItemType.Goal, null,
						training)
				}))
			})
		}
	}
}

enum TrainingItemType {
	Target = 0,
	Goal = 1,
	Utterance = 2,
}

export class TrainingItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly type: TrainingItemType,
		public readonly target?: string,
		private training?: Training,
		public readonly description?: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState)
		if (training) this.description = training.alignedNL
	}

	get tooltip(): string {
		return this.training ? `${this.training.alignedNL}` : ''
	}

	// get description(): string {
	// 	return this.training ? this.training.alignedNL : ''
	// }
}

