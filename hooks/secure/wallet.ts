/*
  Phoenix Campanile
  Manticore Technologies, LLC
  (c) 2024

  @/hooks/secure/wallet.ts
  This file stores some static methods for managing the saved wallet
  as well as a hook for using the wallet. If no wallet exists, the hook
  will route to the recovery screen (@/app/enter-seed-phrase.tsx)
*/

/* Imports */
import { evrmore as EVRMORE_NETWORK } from '@/components/evrmorejs-lib/Networks';
import * as bip39 from '@/components/evrmorejs-lib/bip39';
import ColorLogger from '@/components/ColorLogger';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

/* Creates a new bip39 mnemonic seed 
   and derives an HD seed.
*/
export const createWallet = (mnemonic: string = bip39.generateMnemonic(256), network = EVRMORE_NETWORK): Wallet => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  return { mnemonic, seed: seed.toString('hex') };
};

/* Saves a wallet to wallet.dat
   using secure storage, returns 
   true or false
*/
export const saveWallet = async (wallet: Wallet): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync('wallet.dat', JSON.stringify(wallet));
    return true;
  } catch (e) {
    return false;
  }
};

/* Loads a the wallet from wallet.dat
   and returns the parsed JSON object 
   or throws an error
*/
export const loadWallet = async () => {
  const savedWallet = await SecureStore.getItemAsync('wallet.dat');
  if (savedWallet) {
    return JSON.parse(savedWallet);
  } else {
    throw new Error('No saved wallet');
  }
};

/* Checks for a saved wallet by 
   attempting to read wallet.dat
   and returns 
*/
export const walletExists = async (): Promise<boolean> => {
  const savedWallet = await SecureStore.getItemAsync('wallet.dat');
  return !!savedWallet;
};

/* Deletes the existing wallet.dat file
   returns false if theres an error
*/
export const deleteWallet = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync('wallet.dat');
    return true;
  } catch (e) {
    return false;
  }
};

/* The hook to use the saved wallet, 
   redirects to the recovery screen 
   if there is no saved wallet 
*/
export const UseWallet = (): Wallet | null => {

  /* Name for the ColorLogger */
  const name: any = ["[UseWallet]", "lightBlue", "italic"]

  /* Create new state for the wallet */
  const [wallet, setWallet] = useState<Wallet | null>(null) 
  
  /* Also grab a router hook for the redirect */
  const router = useRouter();

  /* As soon as our hook is called */
  useEffect(()=>{

    /* Try to fetch wallet.dat */
    fetchWallet();
  
  }, [])


  /* Private method that attempts to load wallet.dat 
     If there is no such file, it will redirect to 
     the recover seed phrase screen
  */
  const fetchWallet = async()=>{
  
    /* Try to load wallet.dat */    
    const savedWallet: string | null = await SecureStore.getItemAsync('wallet.dat');
    
    /* Check if savedWallet is null or not */
    if (savedWallet){

      /* If savedWallet exists then we are good to go */
      ColorLogger.log(name, [`Wallet loaded successfully`, "lightGreen", "italic"])
    
      /* Parse the data and set the wallet constant */
      setWallet(JSON.parse(savedWallet))
    
    }else{

      /* If savedWallet is null then we must redirect */
      ColorLogger.log(name, [`No wallet.dat file found. Sending to recovery screen.`, "lightRed", "italic"])
      
      /* Route to @/app/enter-seed-phrase.tsx */
      router.push({pathname: 'enter-seed-phrase'}); // Navigate to the enter seed phrase page
   
    }

  }
  
  // Return the wallet refrence 
  return wallet
  
}