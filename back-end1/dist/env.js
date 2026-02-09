"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Load environment variables first, before any other application code.
 * This file must be imported first in index.ts so JWT_SECRET is available
 * when the JWT module is loaded.
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
