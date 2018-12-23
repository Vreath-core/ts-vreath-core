"use strict";
exports.__esModule = true;
var crypto = require("crypto");
var secp256k1 = require("secp256k1");
exports.HashFromPass = function (password) {
    var sha256 = crypto.createHash('sha256');
    sha256.update(password);
    var pre = sha256.digest('hex');
    var sha256_2 = crypto.createHash('sha256');
    sha256_2.update(pre);
    var hash = sha256_2.digest('hex');
    return hash;
};
exports.GenerateKeys = function () {
    var Private;
    do {
        Private = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(Private));
    return Private.toString('hex');
};
exports.PublicFromPrivate = function (Private) {
    return secp256k1.publicKeyCreate(Buffer.from(Private, 'hex')).toString('hex');
};
exports.EncryptData = function (data, Private, Public) {
    var secret = secp256k1.ecdh(Buffer.from(Public, 'hex'), Private);
    var cipher = crypto.createCipher('aes-256-cbc', secret);
    var crypted = cipher.update(data, 'utf-8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};
exports.DecryptData = function (data, Private, Public) {
    var secret = secp256k1.ecdh(Buffer.from(Public, 'hex'), Private);
    var decipher = crypto.createDecipher('aes-256-cbc', secret);
    var dec = decipher.update(data, 'hex', 'utf-8');
    dec += decipher.final('utf-8');
    return dec;
};
exports.SignData = function (data, Private) {
    var hash = crypto.createHash("sha256").update(data).digest();
    var sign = secp256k1.sign(Buffer.from(hash), Buffer.from(Private, 'hex'));
    return sign.signature.toString('hex');
};
exports.verifyData = function (data, sign, Public) {
    var hash = crypto.createHash("sha256").update(data).digest();
    var verify = secp256k1.verify(Buffer.from(hash), Buffer.from(sign, 'hex'), Buffer.from(Public, 'hex'));
    return verify;
};
exports.GenereateAddress = function (id, Public) {
    return "Vr:" + id + ":" + exports.HashFromPass(Public);
};
