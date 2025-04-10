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
exports.logout = exports.getCurrentUser = exports.isLoggedIn = exports.register = exports.login = void 0;
// src/services/authService.ts
const axios_1 = __importDefault(require("axios"));
// Authentication API calls
const login = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post('/api/auth/login', { username, password });
        return response.data;
    }
    catch (error) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { success: false, message: 'Network error. Please try again.' };
    }
});
exports.login = login;
const register = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post('/api/auth/register', { username, password });
        return response.data;
    }
    catch (error) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { success: false, message: 'Network error. Please try again.' };
    }
});
exports.register = register;
// Function to check if user is logged in
const isLoggedIn = () => {
    return localStorage.getItem('chessUser') !== null;
};
exports.isLoggedIn = isLoggedIn;
// Function to get current user data
const getCurrentUser = () => {
    const userData = localStorage.getItem('chessUser');
    if (userData) {
        return JSON.parse(userData);
    }
    return null;
};
exports.getCurrentUser = getCurrentUser;
// Logout function
const logout = () => {
    localStorage.removeItem('chessUser');
    window.location.href = '/login';
};
exports.logout = logout;
