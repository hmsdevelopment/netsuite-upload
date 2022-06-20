import { workspace } from 'vscode';
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
    var rootDirectory = workspace.getConfiguration('netSuiteUpload').rootDirectory;
    if (rootDirectory) {
        return join(rootDirectory, absFilePath.slice(workspace.rootPath.length));
    } else {
        return join('SuiteScripts', absFilePath.slice(workspace.rootPath.length));
    }
}

export function getFile(file, callback) {
    getData('file', file.fsPath, callback);
}

export function getDirectory(directory, callback) {
    getData('directory', directory.fsPath, callback);
}

function getAuthHeader(method, data) {
    var nlAuth = workspace.getConfiguration('netSuiteUpload').authentication;
    var netSuiteOAuthKey = workspace.getConfiguration('netSuiteUpload').netSuiteKey;

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
            hash_function: function (base_string, key) {
                return createHmac('sha256', key).update(base_string).digest('base64');
            }
        };

        const oauth = OAuth(opts);

        var token = {
            key: workspace.getConfiguration('netSuiteUpload').netSuiteKey,
            secret: workspace.getConfiguration('netSuiteUpload').netSuiteSecret
        };
        var restletUrl = workspace.getConfiguration('netSuiteUpload').restlet;
        var url_parts = parse(restletUrl, true);

        // Build up the data payload to sign.
        // qs will contain the script and deploy params.
        var qs = url_parts.query;
        var mergedData;
        if (method === 'GET' || method === 'DELETE') {
            // For GETs and DELETES, data ends up in the querystring.
            Object.assign(qs, data);
            mergedData = qs;
        } else {
            // for POSTs and DELETEs, the data isn't in the querystring
            // so we don't need it in the oauth signature.
            mergedData = qs;
        }
        var header = oauth.toHeader(oauth.authorize({
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
    doesRestletNeedUpdating(function (needsUpdating, err) {
        if (needsUpdating) {
            callback(BAD_VERSION_ERROR, err);
            return;
        }

        var relativeName = getRelativePath(objectPath);
        var data = {
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
    var data = {
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
    doesRestletNeedUpdating(function (needsUpdating, err) {
        if (needsUpdating) {
            callback(BAD_VERSION_ERROR, err);
            return;
        }

        var relativeName = getRelativePath(objectPath);
        var data = {
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

    doesRestletNeedUpdating(function (needsUpdating, err) {
        if (needsUpdating) {
            callback(BAD_VERSION_ERROR, err);
            return;
        }
        var relativeName = getRelativePath(objectPath);
        var data = {
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

// const _getRelativePath = getRelativePath;
// export { _getRelativePath as getRelativePath };
// const _getFile = getFile;
// export { _getFile as getFile };
// const _postFile = postFile;
// export { _postFile as postFile };
// const _deleteFile = deleteFile;
// export { _deleteFile as deleteFile };
// const _getDirectory = getDirectory;
// export { _getDirectory as getDirectory };
// const _getRestletVersion = getRestletVersion;
// export { _getRestletVersion as getRestletVersion };