import { Buffer } from "buffer";
import ECPairFactory from '@/components/evrmorejs-lib/ecpair';
import BIP32Factory from "@/components/evrmorejs-lib/bip32";
import * as ecc from '@/components/tiny-secp256k1-asmjs';
import { evrmore as EVRMORE_NETWORK } from "@/components/evrmorejs-lib/Networks";
import { makeRpcRequest } from '@/components/manticore/api';
import { usePrivateKey } from '@/components/useAddress';
import * as Crypto from 'expo-crypto';
import bs58check from "./evrmorejs-lib/bs58check";
import RIPEMD160 from 'ripemd160';
import ColorLogger from "./ColorLogger";

// Initialize BIP32 with the secp256k1 elliptic curve
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export const generateEVRTransaction_NoPSBT = async (amount_sats, fee_sats, recipientAddress, utxos) => {
  console.log("Generating new EVR Transaction");
  const evr_utxos = utxos.filter((a) => a.assetName === "EVR");
  const sortedUTXOs = gatherUTXOs(evr_utxos, amount_sats + fee_sats);
  console.log(`Found ${sortedUTXOs.utxos.length} UTXOs`);

  if (sortedUTXOs.total < amount_sats + fee_sats) {
    throw new Error('Insufficient funds');
  }

  const tx: any = {
    version: 2,
    locktime: 0,
    vin: [],
    vout: []
  };

  // Add inputs
  console.log(JSON.stringify(sortedUTXOs))
  for (const utxo of sortedUTXOs.utxos) {
    tx.vin.push({
      txid: utxo.txid,
      vout: utxo.outputIndex,
      scriptSig: '',
      sequence: 0xffffffff
    });
  }

  // Add output for recipient
  tx.vout.push({
    value: amount_sats,
    scriptPubKey: await createScriptPubKey(recipientAddress)
  });

  // Calculate change and add change output if necessary
  const total_utxo_value = sortedUTXOs.total;
  const change = total_utxo_value - amount_sats - fee_sats;
  if (change > 0) {
    const changeAddress = sortedUTXOs.utxos[0].address; // Assuming change goes back to the first input address
    tx.vout.push({
      value: change,
      scriptPubKey: await createScriptPubKey(changeAddress)
    });
  }

  // Log the transaction before signing
  console.log('Transaction before signing:', JSON.stringify(tx, null, 2));

  // Sign inputs
  const signedTx = await signInputs_NoPSBT(tx, sortedUTXOs.utxos);

  // Log the transaction after signing
  console.log('Transaction after signing:', JSON.stringify(signedTx, null, 2));

  // Serialize transaction to hex
  const rawTx = serializeTransaction(signedTx);

  // Log the raw transaction
  console.log('Raw Transaction Hex:', rawTx);

  logRawTransaction(rawTx)
  
  return rawTx;
};


const logRawTransaction = (rawTx) => {
  const part_size = 2; // 2 hex characters (1 byte)
  const parts = [
    { name: "version", size: 4, color: "green" },
    { name: "input count", size: 1, color: "green" },
    // input 0
    { name: "previous output hash (reversed)", size: 32, color: "cyan" },
    { name: "previous output index", size: 4, color: "red" },
    { name: "script length", size: 1, color: "green" },
    { name: "scriptSig", size: -1, color: "cyan" }, // dynamic size
    { name: "sequence", size: 4, color: "cyan" },
    // output 0
    { name: "value", size: 8, color: "magenta" },
    { name: "script length", size: 1, color: "magenta" },
    { name: "scriptPubKey", size: -1, color: "magenta" }, // dynamic size
    // output 1
    { name: "value", size: 8, color: "magenta" },
    { name: "script length", size: 1, color: "magenta" },
    { name: "scriptPubKey", size: -1, color: "magenta" }, // dynamic size
    { name: "lock time", size: 4, color: "red" }
  ];
  
  let start = 0;
  let end = 0;
  let messages: any = [];
  let dynamicSize;

  parts.forEach((part, index) => {
    if (part.size === -1) {
      // Determine the size of dynamic parts based on the preceding length field
      const lengthHex = rawTx.slice(start, start + part_size);
      dynamicSize = parseInt(lengthHex, 16) * part_size;
      end = start + part_size + dynamicSize;
    } else {
      end = start + part.size * part_size;
    }

    messages.push([`${rawTx.slice(start, end)}`, part.color]);
    start = end;

    // For script length parts, set the size for the following scriptSig or scriptPubKey
    if (part.name.includes("script length")) {
      const lengthHex = rawTx.slice(start - part.size * part_size, start);
      dynamicSize = parseInt(lengthHex, 16) * part_size;
      parts[index + 1].size = dynamicSize / part_size;
    }
  });

  ColorLogger.log(...messages);
}



const serializeTransaction = (tx) => {
  const buffer = Buffer.alloc(1024);
  let offset = 0;

  buffer.writeInt32LE(tx.version, offset);
  offset += 4;

  buffer.writeUInt8(tx.vin.length, offset);
  offset += 1;

  tx.vin.forEach((vin) => {
    Buffer.from(vin.txid, 'hex').reverse().copy(buffer, offset);
    offset += 32;

    buffer.writeUInt32LE(vin.vout, offset);
    offset += 4;

    buffer.writeUInt8(vin.scriptSig.length / 2, offset);
    offset += 1;

    Buffer.from(vin.scriptSig, 'hex').copy(buffer, offset);
    offset += vin.scriptSig.length / 2;

    buffer.writeUInt32LE(vin.sequence, offset);
    offset += 4;
  });

  buffer.writeUInt8(tx.vout.length, offset);
  offset += 1;

  tx.vout.forEach((vout) => {
    // Ensure value is correctly handled as satoshis (integers) in little-endian format
    const valueBuffer = Buffer.alloc(8);
    const value = BigInt(vout.value);
    console.log(`Value in satoshis: ${value}`);
    valueBuffer.writeUInt32LE(Number((value) & BigInt(0xffffffff)), 0);
    valueBuffer.writeUInt32LE(Number(value >> BigInt(32)), 4);
    console.log(`Serialized valueBuffer: ${valueBuffer.toString('hex')}`);
    valueBuffer.copy(buffer, offset);
    offset += 8;

    buffer.writeUInt8(vout.scriptPubKey.length / 2, offset);
    offset += 1;

    Buffer.from(vout.scriptPubKey, 'hex').copy(buffer, offset);
    offset += vout.scriptPubKey.length / 2;
  });

  buffer.writeUInt32LE(tx.locktime, offset);
  offset += 4;

  return buffer.slice(0, offset).toString('hex');
};

const createScriptPubKey = (address) => {
    const decodedAddress = bs58check.decode(address);
    const pubKeyHash = decodedAddress.slice(1); // Remove the version byte
  
    return Buffer.concat([
      Buffer.from([0x76, 0xa9, 0x14]), // OP_DUP OP_HASH160 <len:20>
      pubKeyHash,
      Buffer.from([0x88, 0xac]) // OP_EQUALVERIFY OP_CHECKSIG
    ]).toString('hex');
  };
  

const gatherUTXOs = (utxos, total_sats) => {
  return utxos.sort((a, b) => a.height - b.height).reduce((acc, utxo) => {
    if (acc.total < total_sats && utxo.height !== "unconfirmed") {
      acc.utxos.push(utxo);
      acc.total += utxo.satoshis;
    }
    return acc;
  }, { utxos: [], total: 0 });
};

const signInputs_NoPSBT = async (tx, utxos) => {
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      const privateKey = await usePrivateKey(utxo.address);
      const keyPair = bip32.fromBase58(privateKey, EVRMORE_NETWORK);
  
      const hashForSignature = await getHashForSignature(tx, i, keyPair.publicKey);
      const signature = keyPair.sign(Buffer.from(hashForSignature, 'hex'));
  
      tx.vin[i].scriptSig = Buffer.concat([
        Buffer.from([signature.length + 1]),
        signature,
        Buffer.from([0x01]) // SIGHASH_ALL
      ]).toString('hex');
    }
    return tx;
  };
  
const createScriptPubKeyFromPubKey = async (publicKey) => {
  const sha256Hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Buffer.from(publicKey).toString('hex'),
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  const ripemd160Hash = new RIPEMD160().update(Buffer.from(sha256Hash, 'hex')).digest('hex');

  const pubKeyHash = Buffer.from(ripemd160Hash, 'hex');

  return Buffer.concat([
    Buffer.from([0x76, 0xa9, 0x14]), // OP_DUP OP_HASH160 <len:20>
    pubKeyHash,
    Buffer.from([0x88, 0xac]) // OP_EQUALVERIFY OP_CHECKSIG
  ]).toString('hex');
};

const getHashForSignature = async (tx, vinIndex, publicKey) => {
  const txCopy = JSON.parse(JSON.stringify(tx));
  txCopy.vin.forEach(async (vin, i) => {
    vin.scriptSig = i === vinIndex ? await createScriptPubKeyFromPubKey(publicKey) : '';
  });
  const serializedTx = serializeTransaction(txCopy) + '01000000'; // SIGHASH_ALL
  const sha256Hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    serializedTx,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    sha256Hash,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
};





/*



export const generateAssetTransaction = async (amount_sats: any, fee_sats: any, recipientAddress: any, selectedAsset: any, assetUtxos: any, evrUtxos: any, mainAsset = false) => {
  
  ColorLogger.log(["generateTransaction", "yellow", "underscore"], [`Creating PSBT Object`, "blue"])
  
  // Instantiate the psbt object
  const psbt = new Psbt({ network: EVRMORE_NETWORK });

  // Gather UTXOs to cover the fee
  const fee_utxo_data = await gatherUTXOs(evrUtxos, fee_sats)
  const fee_utxos = fee_utxo_data.utxos;
  const fee_utxos_total = fee_utxo_data.total
  
  // Add the fee utxos to the transaction
  await addUTXOInputs(fee_utxos, psbt);

  // Calculate the fee change
  const fee_change = fee_utxos_total - fee_sats

  // Add the change output to the transaction
  await addChangeOutput(fee_utxos[0].address, fee_change, psbt)

  // Gather UTXOs to cover asset transfer
  const asset_utxo_data = await gatherUTXOs(assetUtxos, amount_sats)
  const asset_utxos = asset_utxo_data.utxos;
  const asset_utxos_total = asset_utxo_data.total;
  
  // Add the asset utxo inputs to the transaction
  await addUTXOInputs(asset_utxos, psbt); 
  ColorLogger.log(["generateTransaction", "yellow", "underscore"], [`Inputs all added`, "green"])

  // Construct transfer asset script
  // "asm": "OP_DUP OP_HASH160 aea99ac2e7609d6c080f149a327ce55eeb5af88d OP_EQUALVERIFY OP_CHECKSIG OP_EVR_ASSET 13657672740643524f4e4f53008053ee7ba80a0075",
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeUInt32LE((amount_sats/100000000) & 0xFFFFFFFF, 0);
  amountBuffer.writeUInt32LE((amount_sats/100000000) >>> 32, 4);
  const assetScript = Buffer.concat([
    Buffer.from("76a914", "hex"), // OP_DUP OP_HASH160
    Buffer.from(recipientAddress, "hex"), // Replace with the hash of the recipient's address
    Buffer.from("88ac", "hex"), // OP_EQUALVERIFY OP_CHECKSIG
    Buffer.from("c01772766e740a", "hex"), // OP_RVN_ASSET
    Buffer.from(selectedAsset, 'utf8'), // Asset name
    amountBuffer,
    Buffer.from('75', 'hex')
  ]);
  ColorLogger.log(["generateTransaction", "yellow", "underscore"], [`${assetScript.toString('hex')}`, "green"])
  
  // Add asset transfer script to output
  psbt.addOutput({
    script: assetScript,
    value: 0,
    address: recipientAddress
  })
  ColorLogger.log(["generateTransaction", "yellow", "underscore"], [`Outputs added`, "green"])
  
  // Sign all the inputs 
  await signInputs([...fee_utxos, ...asset_utxos], psbt)
  
  // Finalize inputs
  try{
  psbt.finalizeAllInputs();
  }catch(e){
    console.log(e)
  }
  // Get the raw transaction hash
  //const raw_tx = psbt.extractTransaction(true).toHex();
  return //raw_tx; 


};

*/