"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Merkle = require("merkle-patricia-tree/secure");
var rlp = require("rlp");
var util_1 = require("util");
exports.en_key = function (key) {
    return rlp.encode(key).toString('hex');
};
exports.de_key = function (key) {
    return rlp.decode(Buffer.from(key, 'hex')).toString('utf-8');
};
exports.en_value = function (value) {
    return rlp.encode(JSON.stringify(value)).toString('hex');
};
exports.de_value = function (value) {
    return JSON.parse(rlp.decode(Buffer.from(value, 'hex')).toString());
};
var Trie = /** @class */ (function () {
    function Trie(db, root) {
        if (root === void 0) { root = ""; }
        if (root === "")
            this.trie = new Merkle(db);
        else
            this.trie = new Merkle(db, Buffer.from(root, 'hex'));
    }
    Trie.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(this.trie.get).bind(this.trie)(key)];
                    case 1:
                        result = _a.sent();
                        if (result == null)
                            return [2 /*return*/, null];
                        return [2 /*return*/, JSON.parse(result)];
                }
            });
        });
    };
    Trie.prototype.put = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(this.trie.put).bind(this.trie)(key, JSON.stringify(value))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.trie];
                }
            });
        });
    };
    Trie.prototype["delete"] = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(this.trie.del).bind(this.trie)(key)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.trie];
                }
            });
        });
    };
    Trie.prototype.now_root = function () {
        return this.trie.root.toString("hex");
    };
    Trie.prototype.checkpoint = function () {
        this.trie.checkpoint();
        return this.trie;
    };
    Trie.prototype.filter = function (check) {
        if (check === void 0) { check = function (value) { return true; }; }
        return __awaiter(this, void 0, void 0, function () {
            var result, stream;
            return __generator(this, function (_a) {
                result = [];
                stream = this.trie.createReadStream();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        try {
                            stream.on('data', function (data) {
                                var value = JSON.parse(data.value.toString());
                                if (check(value))
                                    result.push(value);
                            });
                            stream.on('end', function (data) {
                                resolve(result);
                            });
                        }
                        catch (e) {
                            reject(e);
                        }
                    })];
            });
        });
    };
    Trie.prototype.checkRoot = function (root) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(this.trie.checkRoot).bind(this.trie)(exports.en_key(root))];
                    case 1:
                        result = _a.sent();
                        if (result == null)
                            return [2 /*return*/, false];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return Trie;
}());
exports.Trie = Trie;
