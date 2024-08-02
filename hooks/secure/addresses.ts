/* Imports */
import ColorLogger from "@/components/ColorLogger"
import { useEffect, useState } from "react"
import BIP32Factory from "@/components/evrmorejs-lib/bip32";
import * as ecc from '@/components/tiny-secp256k1-asmjs';
import { UseWallet } from "./wallet";
import { evrmore as network } from "@/components/evrmorejs-lib/Networks";
import { Buffer } from "buffer";
import ECPairFactory from "@/components/evrmorejs-lib/ecpair";
import { p2pkh } from "@/components/evrmorejs-lib/Payments";
import { makeRpcRequest } from "@/components/manticore/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";


/* The hook to use the saved addresses, 
   returns null if there are no addresses 
*/
export const UseAddresses = (wallet: Wallet | null) =>{

    /* Name for the ColorLogger */
    const name: any = ["[UseAddresses]", "lightBlue", "italic"];

    /* Create new state for the addresses */
    const [addresses, setAddresses] = useState<Addresses>([]);
    const [changeAddresses, setChangeAddresses] = useState<Addresses>([]);

    /* Bool to know when we are discovering */
    const [discovering, setDiscovering] = useState<boolean>(false);
    const [completed, setCompleted] = useState<boolean>(false);

    const router = useRouter()

    /* As soon as our hook is called */
    useEffect(()=>{        
        
        if(addresses.length==0&&wallet&&wallet.seed){
            ColorLogger.log(name, ["Wallet is ready", "green", "italic"])
            discoverAddresses();
        }
        /* Try to fetch wallet.dat */
    }, [wallet])

    /* Private method that derives addresses until 
        it hits multiple with a zero balance 
    */
    const discoverAddresses = async()=>{

        const saved_addresses = await AsyncStorage.getItem("addresses.dat")
        const saved_changeAddresses = await AsyncStorage.getItem("changeAddresses.dat")
        console.log(saved_addresses)
        console.log(saved_changeAddresses)
        if (saved_addresses&&saved_changeAddresses){
            setAddresses(JSON.parse(saved_addresses))
            setChangeAddresses(JSON.parse(saved_changeAddresses))
            return 
        }
        
        ColorLogger.log(name, ["Beginning address discovery at the default root path m/44'/175'/0'", "lavender", "italic"])
        
        setDiscovering(true);
        router.replace({pathname: "loading", params:{message: "Discovering addresses\nThis may take a moment..."}})
        /* Go to the loading page */

        let index = 0, prev_unused = 0;
        const newAddresses = [];
        const newChangeAddresses = [];

        while(prev_unused<2){
            const address = await deriveAddress(`m/44'/175'/0'/0/${index}`);
            prev_unused += address.received==0?1:0;
            newAddresses.push(address);
            index += 1;
        }

        index = 0, prev_unused = 0;

        while(prev_unused<2){
            const changeAddress = await deriveAddress(`m/44'/175'/0'/1/${index}`);
            prev_unused += changeAddress.received==0?1:0;
            newChangeAddresses.push(changeAddress);
            index += 1;
        }

        setAddresses(newAddresses);
        setChangeAddresses(newChangeAddresses);
        router.replace({pathname: "(tabs)"})

        await AsyncStorage.setItem("addresses.dat", JSON.stringify(newAddresses))
        await AsyncStorage.setItem("changeAddresses.dat", JSON.stringify(newChangeAddresses))

        setDiscovering(false)
        setCompleted(true)
    }

    /* Private method that derives an address 
        at the specified path 
    */
    const deriveAddress = async(path: string): Promise<Address> =>{

        /* Create a bip32 object */ 
        const bip32 = BIP32Factory(ecc);
        const ecpair = ECPairFactory(ecc);
        
        /* Begin deriving the address */
        ColorLogger.log(name, [`Deriving address at path ${path}`, "lavender", "italic"])

        /* Derive the root keyPair */
        const rootKeyPair = bip32.fromSeed(Buffer.from(wallet.seed, 'hex'), network);
        
        /* Derive the child keyPair */
        const childKeyPair = rootKeyPair.derivePath(path);

        /* Derive the p2pkh (address hash) from child pubkey */
        const address = p2pkh({ pubkey: childKeyPair.publicKey, network }).address;

        /* Derive the private key as wif */
        const privateKey = childKeyPair.toBase58();

        /* Get the address balance */
        const balance = address?await makeRpcRequest('getaddressbalance', [{addresses: [address]}]):0;

        return {
            address,
            privateKey,
            hdkeypath: path,
            balance: balance.balance,
            received: balance.received
        }
    }

    /* Public method that derives and saves an address */
    const generateAddress = async(path: string): Promise<Address> =>{
        const address = await deriveAddress(path);
        const newAddresses = [...addresses, address];
        setAddresses(newAddresses);
        await AsyncStorage.setItem('addresses.dat', JSON.stringify(newAddresses))
        return address;      
    }

    const labelAddress = async (address: string, label: string) => {
        console.log(`Adding label "${label}" to address ${address}`);
        let found = false;
        const updatedAddresses = addresses.map(item => {
          if (item.address === address) {
            found = true;
            return { ...item, label: label };
          }
          return item;
        });
        if(found)setAddresses(updatedAddresses);
        if(!found){
            const updatedChangeAddresses = changeAddresses.map(item => {
                if (item.address === address) {
                return { ...item, label: label };
                }
                return item;
            });
            setChangeAddresses(updatedChangeAddresses);
        }
        await AsyncStorage.setItem('addresses.dat', JSON.stringify(updatedAddresses));
      };
      const updateBalance = async(address: string)=>{

        const newBalance = await makeRpcRequest('getaddressbalance', [{addresses: [address]}])

        let found = false;
        const updatedAddresses = addresses.map(item => {
          if (item.address === address) {
            found = true;
            item.balance = newBalance.balance
            item.received = newBalance.received
          }
          return item;
        });
        if(found)setAddresses(updatedAddresses);
        if(!found){
            const updatedChangeAddresses = changeAddresses.map(item => {
                if (item.address === address) {
                    found = true;
                    item.balance = newBalance.balance
                    item.received = newBalance.received
                  }
                  return item;
            });
            setChangeAddresses(updatedChangeAddresses);
        }
        await AsyncStorage.setItem('addresses.dat', JSON.stringify(updatedAddresses));

      }

    return {addresses, changeAddresses, discovering, completed, generateAddress, labelAddress, updateBalance}
}
