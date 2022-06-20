import { workspace, workspaceFolders } from 'vscode';
import * as superAgent from 'superagent';
import { createHmac } from 'crypto';
import { join } from 'path';
import OAuth from 'oauth-1.0a';
import compareVersions from 'compare-versions';
import { parse } from 'url';
const BAD_VERSION_ERROR = {
    shortmessage: "You might need to update the vscodeExtensionRestlet.js RESTlet in NetSuite to the latest version."
};

export function getRelativePath(absFilePath) {
    const rootDirectory = workspace.getConfiguration('netSuiteUpload').rootDirectory;
    if (rootDirectory) {
        return join(rootDirectory, absFilePath.slice(workspaceFolders.length));
    } else {
        return join('SuiteScripts', absFilePath.slice(workspaceFolders.length));
    }
}

export function getFile(file, callback) {
    getData('file', file.fsPath, callback);
}

export function getDirectory(directory, callback) {
    getData('directory', directory.fsPath, callback);
}

function getAuthHeader(method, data) {
    const nlAuth = workspace.getConfiguration('netSuiteUpload').authentication;
    const netSuiteOAuthKey = workspace.getConfiguration('netSuiteUpload').netSuiteKey;

    if (nlAuth && nlAuth.length > 0) {
        return workspace.getConfiguration('netSuiteUpload').authentication;
    }
    if (netSuiteOAuthKey && netSuiteOAuthKey.length > 0) {
        const opts = {
            consumer: {
                key: workspace.getConfiguration('netSuiteUpload').consumerToken,
                secret: workspace.getConfiguration('netSuiteUpload').consumerSecret
            },
            signature_method: 'HMAC-SHA256',
            realm: workspace.getConfiguration('netSuiteUpload').realm,
            hash_function: (base_string, key) => {
                return createHmac('sha256', key).update(base_string).digest('base64');
            }
        };

        const oauth = OAuth(opts);

        const token = {
            key: workspace.getConfiguration('netSuiteUpload').netSuiteKey,
            secret: workspace.getConfiguration('netSuiteUpload').netSuiteSecret
        };
        const restletUrl = new URL(workspace.getConfiguration('netSuiteUpload').restlet);
        const url_parts = parse(restletUrl, true);

        // Build up the data payload to sign.
        // qs will contain the script and deploy params.
        const qs = url_parts.query;
        let mergedData;
        if (method === 'GET' || method === 'DELETE') {
            // For GETs and DELETES, data ends up in the querystring.
            Object.assign(qs, data);
            mergedData = qs;
        } else {
            // for POSTs and DELETEs, the data isn't in the querystring
            // so we don't need it in the oauth signature.
            mergedData = qs;
        }
        const header = oauth.toHeader(oauth.authorize({
            method: method,
            url: restletUrl,
            data: mergedData
        }, token));

        console.log(header.Authorization);
        return header.Authorization;
    }

    throw "No authentication method found in settings.json (user or workspace settings).";
}

export function doesRestletNeedUpdating(needsUpdating) {
    getRestletVersion((err, res) => {
        if (err || (compareVersions(res.body.restletVersion, "1.0.2") === -1)) {
            needsUpdating(true, err);
        } else {
            needsUpdating(false, err);
        }
    });
}

function getData(type, objectPath, callback) {
    doesRestletNeedUpdating((needsUpdating, err) => {
        if (needsUpdating) {
            callback(BAD_VERSION_ERROR, err);
            return;
        }

        const relativeName = getRelativePath(objectPath);
        const data = {
            type: type,
            name: relativeName
        };
        superAgent.get(workspace.getConfiguration("netSuiteUpload").restlet)
            .set("Content-Type", "application/json")
            .set("Authorization", getAuthHeader("GET", data))
            .query(data)
            .end((err, res) => {
                callback(err, res);
            });
    });
}

function getRestletVersion(callback) {
    const data = {
        type: "version"
    };
    superAgent.get(workspace.getConfiguration("netSuiteUpload").restlet)
        .set("Content-Type", "application/json")
        .set("Authorization", getAuthHeader("GET", data))
        .query(data)
        .end((err, res) => {
            callback(err, res);
        });
}

export function postFile(file, content, callback) {
    postData('file', file.fsPath, content, callback);

}

function postData(type, objectPath, content, callback) {
    doesRestletNeedUpdating((needsUpdating, err) => {
        if (needsUpdating) {
            callback(BAD_VERSION_ERROR, err);
            return;
        }

        const relativeName = getRelativePath(objectPath);
        const data = {
            type: type,
            name: relativeName,
            content: content
        };
        superAgent.post(workspace.getConfiguration("netSuiteUpload").restlet)
            .set("Content-Type", "application/json")
            .set("Authorization", getAuthHeader("POST", data))
            .send(data)
            .end((err, res) => {
                callback(err, res);
            });
    });
}

export function deleteFile(file, callback) {
    if (doesRestletNeedUpdating(callback)) return;
    deleteData('file', file.fsPath, callback);
}

function deleteData(type, objectPath, callback) {

    doesRestletNeedUpdating((needsUpdating, err) => {
        if (needsUpdating) {
            callback(BAD_VERSION_ERROR, err);
            return;
        }
        const relativeName = getRelativePath(objectPath);
        const data = {
            type: type,
            name: relativeName
        };
        superAgent.delete(workspace.getConfiguration("netSuiteUpload").restlet)
            .set("Content-Type", "application/json")
            .set("Authorization", getAuthHeader("DELETE", data))
            .query(data)
            .end((err, res) => {
                callback(err, res);
            });
    });
}