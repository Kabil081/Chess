"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Database_1 = require("../Database");
const router = express_1.default.Router();
router.route('/register').post((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, email } = req.body;
    if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
    }
    try {
        const result = yield (0, Database_1.registerUser)(username, password, email);
        res.json(result);
    }
    catch (error) {
        console.error('Register route error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}));
router.route('/login').post((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
    }
    try {
        const result = yield (0, Database_1.authenticateUser)(username, password);
        res.json(result);
    }
    catch (error) {
        console.error('Login route error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}));
exports.default = router;
