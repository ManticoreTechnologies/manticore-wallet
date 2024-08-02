import { Buffer } from "buffer";
import { Psbt } from "@/components/evrmorejs-lib/psbt";
import ECPairFactory from '@/components/evrmorejs-lib/ecpair';
import BIP32Factory from "@/components/evrmorejs-lib/bip32";
import * as ecc from '@/components/tiny-secp256k1-asmjs';
import { evrmore as EVRMORE_NETWORK } from "@/components/evrmorejs-lib/Networks";
import { makeRpcRequest } from '@/components/manticore/api';
import { loadAddresses, usePrivateKey } from '@/components/useAddress';
import { ripemd160, sha256 } from "./evrmorejs-lib/Crypto";
import bs58check from "./evrmorejs-lib/bs58check";
import ColorLogger from "./ColorLogger";
import * as bscript from '@/components/evrmorejs-lib/Script';
import useUTXOs from "@/hooks/useUTXOs";
import * as Crypto from "@/components/evrmorejs-lib/Crypto"
import * as payments from "@/components/evrmorejs-lib/Payments"
const network = EVRMORE_NETWORK;
// Initialize BIP32 with the secp256k1 elliptic curve
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

function gatherUTXOs(utxos: any, total_sats: any) {
  return utxos.sort((a: any, b: any) => a.height - b.height).reduce((acc: any, utxo: any) => {
    // add utxos to acc list until we have enough value
    if (acc.total < total_sats && utxo.height != "unconfirmed") {
      acc.utxos.push(utxo);
      acc.total += utxo.satoshis;
    }
    return acc;
    // Return the utxos and total value
  }, { utxos: [], total: 0 });
}

const addUTXOInputs = async (utxos: any, psbt: Psbt) => {
  ColorLogger.log(["addUTXOInputs", "yellow", "underscore"], [`Adding ${utxos.length} utxo inputs`])
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    const raw_tx = await makeRpcRequest('getrawtransaction', [utxo.txid]);
    // Add the UTXO to the psbt input
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.outputIndex,
      nonWitnessUtxo: Buffer.from(raw_tx, 'hex'),
    });
  }
}

const addChangeOutput = async (address: any, change: any, psbt: Psbt) => {
  // Add the change output
  psbt.addOutput({
    address: address,
    value: change
  });
}

const addRecipientOutput = async (address: any, amount: any, psbt: Psbt) => {
  // Add the output for recipient
  psbt.addOutput({
    address: address,
    value: amount
  });
}
/**
 Example:
76a914aea99ac2e7609d6c080f149a327ce55eeb5af88d88acc01265767274 05 435942455200 e1f5050000000075
76a914aea99ac2e7609d6c080f149a327ce55eeb5af88d88acc01265767274 05 435942455200 0000000000000075
 Mine:


 */


const decodeBase58Address = (address: any) => {
  const decoded = bs58check.decode(address);
  return decoded.slice(1, 21); // Remove version byte and checksum
}
const amountToBufferLE = (amount: any) => {
  const buffer = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    buffer[i] = amount & 0xff;
    amount = Math.floor(amount / 256);
  }
  return buffer;
}
const decimalToHex = (decimal: number, byteSize: number = 8): string => {
  let hex = decimal.toString(16);
  const requiredLength = byteSize * 2;
  while (hex.length < requiredLength) {
    hex = '0' + hex;
  }
  return hex;
}


const addAssetOutput = async (address: any, assetName: any, amount: any, psbt: Psbt) => {
  console.log(amount)
  // Create the asset transfer scriptPubKey
  const pubkeyHash = decodeBase58Address(address);
  console.log("PUBKEYHASH");
  console.log(pubkeyHash);
  const total_bytes = 3 + 1 + 1 + Buffer.from(assetName, 'utf8').byteLength + 8
  ColorLogger.log([`${amountToBufferLE(amount).toString('hex')}`, "red", "bright"])
  ColorLogger.log([`${  Buffer.from(assetName, 'utf8').toString('hex')  }`, "red", "bright"])
  const byteLengthBuffer = Buffer.allocUnsafe(1);
  byteLengthBuffer.writeUInt8(Buffer.from(assetName, 'utf8').byteLength, 0);
  ColorLogger.log([`${  byteLengthBuffer.toString('hex')  }`, "red", "bright"])

  
  const asset_script_header = Buffer.concat([Buffer.from('657672', 'hex'), Buffer.from([0x74]), byteLengthBuffer, Buffer.from(assetName, 'utf8'), amountToBufferLE(amount)])
  console.log(Buffer.from('657672', 'hex').toString('hex'))
  const assetScript = bscript.compile([
    bscript.OPS.OP_DUP,
    bscript.OPS.OP_HASH160,
    Buffer.from(pubkeyHash),
    bscript.OPS.OP_EQUALVERIFY,
    bscript.OPS.OP_CHECKSIG,
    // Additional data for asset transfer
    bscript.OPS.OP_EVR_ASSET, // Assuming OP_EVR_ASSET is 0xc0
    asset_script_header,
     // asset operation type (transfer(t)=74)
    bscript.OPS.OP_DROP
  ]);
  console.log("ASSET SCRIPT INCOMING")
  console.log(assetScript.toString('hex'))
  psbt.addOutput({
    script: assetScript,
    value: 0, // value in satoshis, set to 0 for asset transfer
  });
}




const addHTLCAssetOutput = async (address: any, assetName: any, amount: any, psbt: Psbt, hash: any, timeout: number, refundAddress: any) => {
  console.log(amount);

  // Create the asset transfer scriptPubKey
  const pubkeyHash = decodeBase58Address(address);
  const refundPubkeyHash = decodeBase58Address(refundAddress);
  console.log("PUBKEYHASH");
  console.log(pubkeyHash);
  const total_bytes = 3 + 1 + 1 + Buffer.from(assetName, 'utf8').byteLength + 8;
  ColorLogger.log([`${amountToBufferLE(amount).toString('hex')}`, "red", "bright"]);
  ColorLogger.log([`${Buffer.from(assetName, 'utf8').toString('hex')}`, "red", "bright"]);
  const byteLengthBuffer = Buffer.allocUnsafe(1);
  byteLengthBuffer.writeUInt8(Buffer.from(assetName, 'utf8').byteLength, 0);
  ColorLogger.log([`${byteLengthBuffer.toString('hex')}`, "red", "bright"]);

  const asset_script_header = Buffer.concat([Buffer.from('657672', 'hex'), Buffer.from([0x74]), byteLengthBuffer, Buffer.from(assetName, 'utf8'), amountToBufferLE(amount)]);
  console.log(Buffer.from('657672', 'hex').toString('hex'));

  const assetScript = bscript.compile([
    bscript.OPS.OP_DUP,
    bscript.OPS.OP_HASH160,
    Buffer.from(pubkeyHash),
    bscript.OPS.OP_EQUALVERIFY,
    bscript.OPS.OP_CHECKSIG,
    // Additional data for asset transfer
    bscript.OPS.OP_EVR_ASSET, // Assuming OP_EVR_ASSET is 0xc0
    asset_script_header,
    bscript.OPS.OP_DROP
  ]);

  // Create the HTLC script
  const htlcScript = bscript.compile([
    bscript.OPS.OP_IF,
    bscript.OPS.OP_HASH160,
    Buffer.from(hash, 'hex'),
    bscript.OPS.OP_EQUALVERIFY,
    bscript.OPS.OP_DUP,
    bscript.OPS.OP_HASH160,
    Buffer.from(pubkeyHash),
    bscript.OPS.OP_ELSE,
    Buffer.from(timeout.toString(16), 'hex'),
    bscript.OPS.OP_CHECKLOCKTIMEVERIFY,
    bscript.OPS.OP_DROP,
    bscript.OPS.OP_DUP,
    bscript.OPS.OP_HASH160,
    Buffer.from(refundPubkeyHash),
    bscript.OPS.OP_ENDIF,
    bscript.OPS.OP_EQUALVERIFY,
    bscript.OPS.OP_CHECKSIG
  ]);

  console.log("HTLC SCRIPT INCOMING");
  console.log(htlcScript.toString('hex'));

  const finalScript = bscript.compile([
    ...assetScript,
    ...htlcScript
  ]);

  console.log("FINAL SCRIPT");
  console.log(finalScript.toString('hex'));

  psbt.addOutput({
    script: finalScript,
    value: 0, // value in satoshis, set to 0 for asset transfer
  });
};

const signInputs = async (utxos: any, psbt: Psbt) => {
  // Finally, sign the inputs
  for (let i = 0; i < utxos.length; i++) {
    ColorLogger.log(["Send", "yellow", "underscore"], [`Signing Input ${i}`, "cyan", "bright"]);
    const privateKey = await usePrivateKey(utxos[i].address);
    const feeKeyPair = bip32.fromBase58(privateKey, EVRMORE_NETWORK);
    psbt.signInput(i, feeKeyPair);
  }
}
const name: any = ["Send", "yellow", "underscore"];
export const generateHTLCTransaction = async(secret: string)=>{
  
  ColorLogger.log(name, [" --- Generating HTLC Transaction ---", "steelBlue", "bright"]);

  // Party A creates a hash of the secret.  
  // Party A does not tell Party B the secret, 
  // only the secret hash.
  
  // Create a hash of the provided secret
  const secret_hash: string = Crypto.sha256(Buffer.from(secret)).toString("hex");
  ColorLogger.log(name, [`${secret_hash}`, "steelBlue", "bright"])
  
  /* First i will try a timelock transaction
     Lets lock 1 EVR for 10 blocks and then try claiming it 
     after 2 blocks and 11 blocks to test the transaction 
     For this we will need a receiving address, locktime (in blocks) */

  // Define the address that can claim the funds 
  const recipient_address = "EZKM2fMjdECU8D6fqs3fQPQ38osrucKyRv"
  // Now define the locktime 
  const blocktime = 10 // lock the funds for 2 blocks
  // Set the amount (in satoshis)
  const amount = 1000000; // 0.01 evr
  // Set the fee (in satoshis)
  const fee = 1000000; // 0.01 evr
  
  // Get the current block height
  const blockheight = await makeRpcRequest('getblockcount', [])
  // Add locktime to block height
  const locktime = blocktime + blockheight

  // Decode address into pubkey hash
  const pubkeyHash = decodeBase58Address(recipient_address);
  
  // Create the timelock script
  const timelock_script = bscript.compile([
    Buffer.from(locktime.toString()), // The lock time 
    bscript.OPS.OP_CHECKLOCKTIMEVERIFY, // Check blockheight >= locktime
    bscript.OPS.OP_DROP, // Remove top stack item 
    Buffer.from(pubkeyHash), // The public key has of recipient address
    bscript.OPS.OP_CHECKSIG // Check if the transaction is signed by the recipient address
  ])

  // Create a p2sh address for the timelock script
  const p2sh = payments.p2sh({redeem: {output: timelock_script, network}, network})

  ColorLogger.log(name, [`P2SH Address: ${p2sh.address}`, 'emeraldGreen', 'bright'])
  if (!p2sh.address)return "Failed to derive p2sh address";
  // Create a psbt object
  const psbt = new Psbt({network})

  /* Use this UTXO to pay the address */
  const utxo = {
      address: "EYTRmjgAyfS4DtLVvcagUsU4co7F4Yg8gi",
      assetName: "EVR",
      txid: "46041712b89cac341f8a660d31e0d59d75d0b9d645bba86a06ec07c09798f02a",
      outputIndex: 0,
      script: "76a914a7da3bbaafb128af0f54efe17577730e14ff48fc88ac",
      satoshis: 800215000000,
      height: 901217
  }

  
  // Add the UTXO input
  const raw_tx = await makeRpcRequest('getrawtransaction', [utxo.txid]);
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.outputIndex,
    nonWitnessUtxo: Buffer.from(raw_tx, 'hex'),
  });

  //const total_fee = await calculateTransactionFee(utxo, p2sh, amount, recipient_address, fee)
    // Add the amount to lock
    psbt.addOutput({
      address: p2sh.address,
      value: amount
    })
  
    // Calculate the change
    const change = utxo.satoshis - amount - fee
  
    // Add the change output
    psbt.addOutput({
      address: recipient_address,
      value: change
    })
      // Sign the transaction
    const privateKey = await usePrivateKey("EYTRmjgAyfS4DtLVvcagUsU4co7F4Yg8gi")
    const feeKeyPair = bip32.fromBase58(privateKey, EVRMORE_NETWORK);
    psbt.signInput(0, feeKeyPair);
    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    return tx.toHex();
}
const calculateTransactionFee = async(utxo: any, p2sh: any, amount: any, recipient_address: any, fee_rate:any=1000000)=>{
  const psbt = new Psbt({network})

  // Add the UTXO input
  const raw_tx = await makeRpcRequest('getrawtransaction', [utxo.txid]);
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.outputIndex,
    nonWitnessUtxo: Buffer.from(raw_tx, 'hex'),
  });

  // Add the amount to lock
  psbt.addOutput({
    address: p2sh.address,
    value: amount
  })

  // Calculate the change
  const change = utxo.satoshis - amount

  // Add the change output
  psbt.addOutput({
    address: recipient_address,
    value: change
  })

  // Sign the transaction
  const privateKey = await usePrivateKey("EYTRmjgAyfS4DtLVvcagUsU4co7F4Yg8gi")
  const feeKeyPair = bip32.fromBase58(privateKey, EVRMORE_NETWORK);
  psbt.signInput(0, feeKeyPair);
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const bytes = tx.byteLength();
  const kilobytes = bytes/1000;
  const total_fee = fee_rate*kilobytes;
  return total_fee
}
export const claimTimelockedFunds = async() => {
  const recipient_address = "EZKM2fMjdECU8D6fqs3fQPQ38osrucKyRv";

  const locktime = 905980 + 10
  const pubkeyHash = decodeBase58Address(recipient_address);
    // Create the timelock script
    const redeemScript = bscript.compile([
      Buffer.from(locktime.toString()), // The lock time 
      bscript.OPS.OP_CHECKLOCKTIMEVERIFY, // Check blockheight >= locktime
      bscript.OPS.OP_DROP, // Remove top stack item 
      Buffer.from(pubkeyHash), // The public key has of recipient address
      bscript.OPS.OP_CHECKSIG // Check if the transaction is signed by the recipient address
    ])
  // Define the address that can claim the funds 
  // Set the fee (in satoshis)
  const fee = 1000000; // 0.01 evr

  const utxo = {
    address: "eJApDF4QwRPJV7WdXqsLbQWQ29qHR71tZz",
    assetName: "EVR",
    txid: "9408d0caa5ee1c77e3c982a4d38a7f0c91556389db3db36536996806d07602a4",
    outputIndex: 0,
    script: "a914b053394a337afcf294aaabd892d0a3cec631829a87",
    satoshis: 1000000,
    height: 905981
  };

  const psbt = new Psbt({ network: EVRMORE_NETWORK });

  // Add the UTXO input
  const raw_tx = await makeRpcRequest('getrawtransaction', [utxo.txid]);
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.outputIndex,
    nonWitnessUtxo: Buffer.from(raw_tx, 'hex'),
    redeemScript: redeemScript
  });

  // Claim the entire utxo amount, minus tx fee
  psbt.addOutput({
    address: recipient_address,
    value: utxo.satoshis - fee
  });

  // Sign the transaction
  const privateKey = "L4NRGMaZyfv6DmYH3M8Q8YJGqNsjhEqmhzGUWGQWMX3fQTYYChSF"//await usePrivateKey("EZKM2fMjdECU8D6fqs3fQPQ38osrucKyRv");
  const feeKeyPair = ECPair.fromWIF(privateKey, EVRMORE_NETWORK);
  psbt.signInput(0, feeKeyPair);
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  console.log(tx.toHex());
  return tx.toHex();
};


// Create an EVR transaction with asset transfer
// amount_sats: the amount of assetName to send
export const generateEVRAssetTransaction = async (amount_sats: number, fee_sats: number, recipientAddress: string, assetName: string, assetAmount: number, utxos: any) => {
  
  const name: any = ["generateEVRAssetTransaction", "yellow", "underscore"]

  ColorLogger.log(name, [`Instantiating PSBT Transaction Object`, "green", "bright"]);
  
  // Instantiate a new PSBT transaction object for the evrmore network 
  const psbt = new Psbt({ network: EVRMORE_NETWORK });

  // Total sats needed to pay fee
  ColorLogger.log(name, [`Fee = ${fee_sats}`, "green", "bright"]);

  // Total sats needed to transfer asset
  const total_sats = amount_sats;

  ColorLogger.log(name, [`Total Sats = ${total_sats}`, "green", "bright"]);
  
  // Retrieve only the evrmore UTXOs
  const evr_utxos = utxos.filter((a: any) => a.assetName === "EVR");
  
  ColorLogger.log(name, [`Found ${evr_utxos.length} EVR utxos`, "green", "bright"]);
  
  // Retrieve asset UTXOs
  const asset_utxos = utxos.filter((a: any) => a.assetName === assetName);
  
  ColorLogger.log(name, [`Found ${asset_utxos.length} ${assetName} utxos`, "green", "bright"]);
  
  // Gather necessary EVR UTXOs
  const sortedEVRUTXOS = gatherUTXOs(evr_utxos, fee_sats);
  const selectedEVRUTXOs = sortedEVRUTXOS.utxos;
  const total_evr_utxo_value = sortedEVRUTXOS.total;

  ColorLogger.log(name, [`Using ${selectedEVRUTXOs.length} EVR utxos | ${total_evr_utxo_value} EVR`, "green", "bright"]);

  // Gather necessary asset UTXOs
  const sortedAssetUTXOS = gatherUTXOs(asset_utxos, assetAmount);
  const selectedAssetUTXOs = sortedAssetUTXOS.utxos;
  const total_asset_utxo_value = sortedAssetUTXOS.total;

  ColorLogger.log(name, [`Using ${selectedAssetUTXOs.length} ${assetName} utxos | ${total_asset_utxo_value} ${assetName}`, "green", "bright"]);
  
  // Add fee inputs
  await addUTXOInputs(selectedEVRUTXOs, psbt);

  // Add asset inputs
  await addUTXOInputs(selectedAssetUTXOs, psbt);
  
  // Calculate fee change 
  const evr_change = total_evr_utxo_value - fee_sats;
  if (evr_change>0)await addChangeOutput(selectedEVRUTXOs[0].address, evr_change, psbt)

  ColorLogger.log(name, [`Change = ${evr_change} EVR | Sent to ${selectedEVRUTXOs[0].address}`, "green", "bright"])

  // Calculate asset change
  const asset_change = total_asset_utxo_value - amount_sats;
  if (asset_change>0)await addAssetOutput(selectedAssetUTXOs[0].address, assetName, asset_change, psbt)

  ColorLogger.log(name, [`Change = ${asset_change} ${assetName} | Sent to ${selectedAssetUTXOs[0].address}`, "green", "bright"])
    
  await addAssetOutput(recipientAddress, assetName, assetAmount, psbt)
  
  await signInputs([...selectedEVRUTXOs, ...selectedAssetUTXOs], psbt);
  psbt.finalizeAllInputs();
  const raw_tx = psbt.extractTransaction(true).toHex();
  const txid = await makeRpcRequest('sendrawtransaction', [raw_tx]);
  console.log(raw_tx);
  

  return txid;
  // Add asset recipient output

  // After sending a transaction i think we need to update the utxos 
  

  return 
  
  

  // Get the raw transaction hash
  // const txid = await makeRpcRequest('sendrawtransaction', [raw_tx]);
  
  
  
  
  // Add the recipient output for EVR
  await addRecipientOutput(recipientAddress, amount_sats, psbt);
  
  // Add the recipient output for Asset
  await addAssetOutput(recipientAddress, assetName, assetAmount, psbt);
  
  // Sign the inputs
  await signInputs([...selectedEVRUTXOs, ...selectedAssetUTXOs], psbt);
  
  // Finalize

}

// Create an EVR transaction. Just a simple send with no scripts
export const generateEVRTransaction = async (amount_sats: number, fee_sats: number, recipientAddress: string, utxos: any) => {

  ColorLogger.log(["Send", "yellow", "underscore"], [`Creating PSBT Object`, "blue"]);

  // Instantiate a new PSBT transaction object for the evrmore network 
  const psbt = new Psbt({ network: EVRMORE_NETWORK });

  // Determine the total value of UTXOs needed
  const total_sats = amount_sats + fee_sats;

  // Retrieve only the evrmore UTXOs
  const evr_utxos = utxos.filter((a: any) => a.assetName === "EVR");

  // Gather necessary UTXOs
  const sortedUTXOS = gatherUTXOs(evr_utxos, total_sats);

  // Get our selected utxos for the inputs
  const selectedUtxos = sortedUTXOS.utxos;

  // Get our total value of the utxos to calculate change
  const total_utxo_value = sortedUTXOS.total;

  ColorLogger.log(["Send", "yellow", "underscore"], [`Covering ${total_sats / 100000000} with ${selectedUtxos.length} UTXOs.`, "cyan", "bright"]);

  // Add UTXO inputs
  await addUTXOInputs(selectedUtxos, psbt);

  // Add the change output
  const send_change = total_utxo_value - amount_sats - fee_sats;
  await addChangeOutput(selectedUtxos[0].address, send_change, psbt);

  // Add the recipient output
  await addRecipientOutput(recipientAddress, amount_sats, psbt);

  // Sign the inputs
  await signInputs(selectedUtxos, psbt);

  // Finalize
  psbt.finalizeAllInputs();

  // Get the raw transaction hash
  const raw_tx = psbt.extractTransaction(true).toHex();
  const txid = await makeRpcRequest('sendrawtransaction', [raw_tx]);
  console.log(txid);
  return txid;
}

const createTimeLockedScript = (lockTime: number, recipientPubKey: Buffer) => {
  const pubkeyHash = decodeBase58Address(recipientPubKey);
  return bscript.compile([
    Buffer.from(lockTime.toString(16), 'hex'), // Locktime
    bscript.OPS.OP_CHECKLOCKTIMEVERIFY,
    bscript.OPS.OP_DROP,
    bscript.OPS.OP_DUP,
    bscript.OPS.OP_HASH160,
    Buffer.from(pubkeyHash),
    bscript.OPS.OP_EQUALVERIFY,
    bscript.OPS.OP_CHECKSIG
  ]);
};
const generateTimeLockedTransaction = async (lockTime: number, recipientAddress: string, amount: number, fee: number, utxos: any) => {
  const psbt = new Psbt({ network: EVRMORE_NETWORK });
  const selectedUTXOs = gatherUTXOs(utxos, amount + fee);

  await addUTXOInputs(selectedUTXOs.utxos, psbt);

  const change = selectedUTXOs.total - amount - fee;
  if (change > 0) await addChangeOutput(selectedUTXOs.utxos[0].address, change, psbt);

  const recipientPubKey = Buffer.from(decodeBase58Address(recipientAddress));
  const timeLockedScript = createTimeLockedScript(lockTime, recipientPubKey);

  psbt.addOutput({
    script: timeLockedScript,
    value: amount
  });

  await signInputs(selectedUTXOs.utxos, psbt);
  psbt.finalizeAllInputs();

  return psbt.extractTransaction(true).toHex();
}
