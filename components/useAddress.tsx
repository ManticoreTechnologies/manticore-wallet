import * as FileSystem from 'expo-file-system';
import ColorLogger from './ColorLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load all addresses from the addresses.json file
export async function loadAddresses(): Promise<any> {
    const addresses = await AsyncStorage.getItem('addresses.dat');
    if (addresses) {
        return JSON.parse(addresses);
    } else {
        return {};
    }
}

// Load all addresses from the changeAddresses.json file
export async function loadChangeAddresses(): Promise< any > {
    const changeAddresses = await AsyncStorage.getItem('changeAddresses.dat');
    if (changeAddresses) {
        return JSON.parse(changeAddresses);
    } else {
        return {};
    }
}
export async function loadAllAddresses(): Promise<{[key: string]: any}>{
    const addresses = await loadAddresses();
    const changeAddresses = await loadChangeAddresses();
    return addresses+changeAddresses
}
// Save the updated dictionary of addresses to the addresses.json file
export async function saveAddresses(addresses: { [key: string]: any }): Promise<void> {
    const fileUri = FileSystem.documentDirectory + 'addresses.json';
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(addresses));
    console.log("Addresses saved successfully");
}

// Save the updated dictionary of change addresses to the changeAddresses.json file
export async function saveChangeAddresses(addresses: { [key: string]: any }): Promise<void> {
    const fileUri = FileSystem.documentDirectory + 'changeAddresses.json';
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(addresses));
}

// Load a specific address by its index
export async function loadAddress(index: string): Promise<any> {
    const addresses = await loadAddresses();
    if (addresses.hasOwnProperty(index)) {
        return addresses[index];
    }
    throw new Error('Address not found at the specified index');
}

// Save an address at a specific index
export async function saveAddressWithIndex(index: number, address: { address: string | undefined, privateKey: string }, change: boolean): Promise<void> {
    if (address == null) {
        throw new Error("Address cannot be null");
    }
    const addresses = await loadAddresses();
    addresses[index.toString()] = address;
    if (!change) await saveAddresses(addresses);
    else await saveChangeAddresses(addresses);
}

// Delete a specific address from the addresses.json file
export async function deleteAddress(addressToDelete: string): Promise<void> {
    const addresses = await loadAddresses();
    const updatedAddresses: { [key: string]: any } = {};
    for (const key in addresses) {
        if (addresses[key].address !== addressToDelete) {
            updatedAddresses[key] = addresses[key];
        }
    }
    await saveAddresses(updatedAddresses);
}

// Delete all addresses from the addresses.json and changeAddresses.json files
export async function deleteAllAddresses(): Promise<boolean> {
    const fileUri = FileSystem.documentDirectory + 'addresses.dat';
    const fileUri2 = FileSystem.documentDirectory + 'changeAddresses.dat';
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    await FileSystem.deleteAsync(fileUri2, { idempotent: true });
    console.log("All addresses deleted");
    return true;
}
// Retrieve the private key using an address
export async function usePrivateKey(address: string): Promise<string> {
    const addresses = await loadAddresses();
    for (const key in addresses) {
        if (addresses[key].address === address) {
            ColorLogger.log(['UseAddress', 'yellow', 'underscore'], [`Found private key: ${addresses[key].privateKey}`, "green", "bright"]);
            return addresses[key].privateKey;
        }
    }
    throw new Error('Private key not found for the specified address');
}