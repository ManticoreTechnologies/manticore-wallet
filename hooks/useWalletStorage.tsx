import * as SecureStore from 'expo-secure-store';
import * as ecc from '@/components/tiny-secp256k1-asmjs';
import { evrmore as EVRMORE_NETWORK } from '@/components/evrmorejs-lib/Networks';
import * as bip39 from "@/components/evrmorejs-lib/bip39";
import BIP32Factory from "@/components/evrmorejs-lib/bip32";
import { saveAddressWithIndex } from '@/components/useAddress';

const bip32 = BIP32Factory(ecc);

// Define the wallet type
type Wallet = {
    mnemonic: string;
    seed: string;
    address: string;
};

const generateWallet: any = (mnemonic: string = bip39.generateMnemonic(256), network = EVRMORE_NETWORK) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    return { mnemonic, seed: seed.toString('hex') };
};

// Try to load the saved wallet
const loadWallet = async () => {
    let savedWallet = await SecureStore.getItemAsync('wallet');
    if (savedWallet) {
        return JSON.parse(savedWallet);
    } else {
        throw Error("No saved wallet");
    }
};

const saveWallet = async (wallet: any) => {
    try {
        await SecureStore.setItemAsync('wallet', JSON.stringify(wallet));
    } catch (e) {
        return false;
    }
    return true;
};

export const useWallet = async (mnemonic: string | undefined = undefined) => {
    if (mnemonic != undefined) {
        const wallet = await generateWallet(mnemonic);
        await saveWallet(wallet);
        return wallet;
    }
    try {
        const wallet = await loadWallet();
        return wallet;
    } catch {
        const wallet = generateWallet();
        await saveWallet(wallet);
        return wallet;
    }
};

// Method to check if wallet exists
export const walletExists = async (): Promise<boolean> => {
    try {
        const savedWallet = await SecureStore.getItemAsync('wallet');
        return !!savedWallet;
    } catch (e) {
        return false;
    }
};

// Method to delete the wallet
export const deleteWallet = async (): Promise<boolean> => {
    try {
        await SecureStore.deleteItemAsync('wallet');
        return true;
    } catch (e) {
        return false;
    }
};
