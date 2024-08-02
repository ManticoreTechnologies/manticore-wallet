import { Buffer } from "buffer";
import { p2pkh } from "@/components/evrmorejs-lib/Payments";
import BIP32Factory from "@/components/evrmorejs-lib/bip32";
import * as ecc from 'tiny-secp256k1';
import { evrmore as EVRMORE_NETWORK } from "@/components/evrmorejs-lib/Networks";
import { loadAddresses, saveAddressWithIndex, saveAddresses } from "./useAddress";
import * as secp from '@noble/secp256k1';
const bip32 = BIP32Factory(ecc);

export const generateAddress = async(seedHex: string | undefined, index: number, change: boolean, network = EVRMORE_NETWORK) => {
  if (!seedHex) return {}
  const seed = Buffer.from(seedHex, 'hex');
  const root = bip32.fromSeed(seed, network);
  const account = root.derivePath(`m/44'/175'/0'/${change?1:0}/${index}`);
  const { address } = p2pkh({ pubkey: account.publicKey, network });
  if (!change){await saveAddressWithIndex(index, { address, privateKey: account.toBase58()}, false)}
  else{await saveAddressWithIndex(index, { address, privateKey: account.toBase58() }, true)}
  console.log("Generation compolete")
  return { address, privateKey: account.toBase58() };
};

export const generateAddresses = async (seedHex: string | undefined, startIndex: number, count: number, network = EVRMORE_NETWORK) => { 
  if (!seedHex) return []
  const seed = Buffer.from(seedHex, 'hex');
  const root = bip32.fromSeed(seed, network);
  const generatedAddresses: any = {};

  for (let i = startIndex; i < startIndex + count; i++) {
    const account = root.derivePath(`m/44'/175'/0'/0/${i}`);
    const { address } = p2pkh({ pubkey: account.publicKey, network });
    generatedAddresses[i] = { address, privateKey: account.toBase58() };
  }
  console.log("Addresses generated")

  const savedAddresses = await loadAddresses();
  const combinedAddresses = { ...savedAddresses, ...generatedAddresses };
  await saveAddresses(combinedAddresses);
  
  return generatedAddresses;
};
