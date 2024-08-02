"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInt32 = void 0;
import {Buffer} from 'buffer'
const randomBytes = (size) => {
    return Buffer.from(require("expo-crypto").getRandomBytes(size))
};
function generateInt32() {
    return (0, randomBytes)(4).readInt32BE(0);
}
exports.generateInt32 = generateInt32;
