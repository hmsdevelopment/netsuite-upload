const vscode = require("vscode");
const netSuiteBl = require("./bl/netSuiteBl");

export function activate(context) {
    console.log('Extension "@hmsdevelopment/netsuite-upload" is now active!');

    const noProjectOpenedErrorMessage =
        "No project is opened. Please open root folder. (SuiteScripts)";
    const noFileSelectedErrorMessage =
        "No file selected. Please right-click the file and select action from context menu.";

    const downloadFileDisposable = vscode.commands.registerCommand(
        "netsuite-upload.downloadFile",
        (file) => {
            if (!file) {
                vscode.window.showErrorMessage(noFileSelectedErrorMessage);
                return;
            }

            // Root SuiteScript folder has to be opened
            if (!vscode.workspaceFolders) {
                vscode.window.showErrorMessage(noProjectOpenedErrorMessage);
                return;
            }

            netSuiteBl.downloadFileFromNetSuite(file);
        }
    );
    context.subscriptions.push(downloadFileDisposable);

    const previewFileDisposable = vscode.commands.registerCommand(
        "netsuite-upload.previewFile",
        (file) => {
            if (!file) {
                vscode.window.showErrorMessage(noFileSelectedErrorMessage);
                return;
            }

            // Root SuiteScript folder has to be opened
            if (!vscode.workspaceFolders) {
                vscode.window.showErrorMessage(noProjectOpenedErrorMessage);
                return;
            }

            netSuiteBl.previewFileFromNetSuite(file);
        }
    );
    context.subscriptions.push(previewFileDisposable);

    const uploadFileDisposable = vscode.commands.registerCommand(
        "netsuite-upload.uploadFile",
        (file) => {
            // Root SuiteScript folder has to be opened
            if (!vscode.workspaceFolders) {
                vscode.window.showErrorMessage(noProjectOpenedErrorMessage);
                return;
            }

            if (!file || !Object.keys(file).length) {
                if (
                    !vscode.window.activeTextEditor &&
                    !vscode.window.activeTextEditor.document.uri
                ) {
                    vscode.window.showErrorMessage(noFileSelectedErrorMessage);
                    return;
                } else {
                    file = vscode.window.activeTextEditor.document.uri;
                }
            }

            netSuiteBl.uploadFileToNetSuite(file);
        }
    );
    context.subscriptions.push(uploadFileDisposable);

    const deleteFileDisposable = vscode.commands.registerCommand(
        "netsuite-upload.deleteFile",
        (file) => {
            if (!file) {
                vscode.window.showErrorMessage(noFileSelectedErrorMessage);
                return;
            }

            // Root SuiteScript folder has to be opened
            if (!vscode.workspaceFolders) {
                vscode.window.showErrorMessage(noProjectOpenedErrorMessage);
                return;
            }

            netSuiteBl.deleteFileInNetSuite(file);
        }
    );
    context.subscriptions.push(deleteFileDisposable);

    const uploadFolderDisposable = vscode.commands.registerCommand(
        "netsuite-upload.uploadFolder",
        (directory) => {
            // Root SuiteScript folder has to be opened
            if (!vscode.workspace.workspaceFolders.length) {
                vscode.window.showErrorMessage(noProjectOpenedErrorMessage);
                return;
            }

            if (!directory || !Object.keys(directory).length) {
                if (
                    !vscode.window.activeTextEditor &&
                    !vscode.window.activeTextEditor.document.uri
                ) {
                    vscode.window.showErrorMessage(noFileSelectedErrorMessage);
                    return;
                } else {
                    const path =
                        vscode.window.activeTextEditor.document.uri.path;
                    directory = vscode.Uri.file(
                        path.substring(0, path.lastIndexOf("/"))
                    );
                }
            }
            netSuiteBl.uploadDirectoryToNetSuite(directory);
        }
    );
    context.subscriptions.push(uploadFolderDisposable);

    const downloadFolderDisposable = vscode.commands.registerCommand(
        "netsuite-upload.downloadFolder",
        (directory) => {
            if (!directory) {
                vscode.window.showErrorMessage("No directory selected.");
                return;
            }

            // Root SuiteScript folder has to be opened
            if (!vscode.workspaceFolders) {
                vscode.window.showErrorMessage(noProjectOpenedErrorMessage);
                return;
            }

            netSuiteBl.downloadDirectoryFromNetSuite(directory);
        }
    );
    context.subscriptions.push(downloadFolderDisposable);

    const addCustomDependencyDisposable = vscode.commands.registerCommand(
        "netsuite-upload.addCustomDependency",
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No file is opened.");
                return;
            }

            netSuiteBl.addCustomDependencyToActiveFile(editor);
        }
    );
    context.subscriptions.push(addCustomDependencyDisposable);

    const addNSDependencyDisposable = vscode.commands.registerCommand(
        "netsuite-upload.addNSDependency",
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No file is opened.");
                return;
            }

            netSuiteBl.addNetSuiteDependencyToActiveFile(editor);
        }
    );
    context.subscriptions.push(addNSDependencyDisposable);

    const getRestletVersion = vscode.commands.registerCommand(
        "netsuite-upload.getRestletVersion",
        () => {
            netSuiteBl.getRestletVersion();
        }
    );
    context.subscriptions.push(getRestletVersion);
}
// this method is called when your extension is deactivated
export function deactivate() {}

