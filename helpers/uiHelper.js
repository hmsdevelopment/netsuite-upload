import { window } from 'vscode';

function askForCustomDependency() {
    var depPath;

    return window.showInputBox({prompt: 'Please type the dependency path'})
        .then(path => {
            depPath = path;
            
            return window.showInputBox({prompt: 'Please type the dependency parameter name'})
                .then(param => {
                    return {
                        depPath: depPath,
                        depParam: param
                    }
                })                    
        })
}

function showListOfNetSuiteDependencies(list) {    
    return window.showQuickPick(list);
}

const _askForCustomDependency = askForCustomDependency;
export { _askForCustomDependency as askForCustomDependency };
const _showListOfNetSuiteDependencies = showListOfNetSuiteDependencies;
export { _showListOfNetSuiteDependencies as showListOfNetSuiteDependencies };
