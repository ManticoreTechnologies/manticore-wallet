import { Buffer } from 'buffer';
import * as bcrypto from '@/components/evrmorejs-lib/Crypto';
import { bitcoin as BITCOIN_NETWORK } from '@/components/evrmorejs-lib/Networks';
import * as bscript from '@/components/evrmorejs-lib/Script';
import { isPoint, typeforce as typef } from '@/components/evrmorejs-lib/Types';
import { Payment, PaymentOpts, StackFunction } from './index';
import * as lazy from './Lazy';
import bs58check from '@/components/evrmorejs-lib/bs58check';
const OPS = bscript.OPS;

// input: {signature} {pubkey}
// output: OP_DUP OP_HASH160 {hash160(pubkey)} OP_EQUALVERIFY OP_CHECKSIG
/**
 * Creates a Pay-to-Public-Key-Hash (P2PKH) payment object.
 *
 * @param a - The payment object containing the necessary data.
 * @param opts - Optional payment options.
 * @returns The P2PKH payment object.
 * @throws {TypeError} If the required data is not provided or if the data is invalid.
 */
export function p2pkha(a: Payment, opts?: PaymentOpts): Payment {
  console.log("Creating p2pkha");
  if (!a.address && !a.hash && !a.output && !a.pubkey && !a.input)
    throw new TypeError('Not enough data');
  opts = Object.assign({ validate: true }, opts || {});
  console.log("We are inside p2pkha");
  typef(
    {
      network: typef.maybe(typef.Object),
      address: typef.maybe(typef.String),
      hash: typef.maybe(typef.BufferN(20)),
      output: typef.maybe(typef.BufferN),

      pubkey: typef.maybe(isPoint),
      signature: typef.maybe(bscript.isCanonicalScriptSignature),
      input: typef.maybe(typef.Buffer),

      // New fields for asset support
      assetName: typef.maybe(typef.String),
      assetAmount: typef.maybe(typef.Number),
      assetUserData: typef.maybe(typef.String),
    },
    a,
  );

  const _address = lazy.value(() => {
    const payload = Buffer.from(bs58check.decode(a.address!));
    const version = payload.readUInt8(0);
    const hash = payload.slice(1);
    return { version, hash };
  });
  const _chunks = lazy.value(() => {
    return bscript.decompile(a.input!);
  }) as StackFunction;

  const network = a.network || BITCOIN_NETWORK;
  const o: Payment = { name: 'p2pkh', network };

  lazy.prop(o, 'address', () => {
    console.log("ADDRESS--");
    if (!o.hash) return;
    const payload = Buffer.allocUnsafe(21);
    payload.writeUInt8(network.pubKeyHash, 0);
    o.hash.copy(payload, 1);
    return bs58check.encode(payload);
  });
  lazy.prop(o, 'hash', () => {
    console.log("HASH--");
    console.log(a.output)
    return ""
  });
  console.log("We are at the output part here");
  lazy.prop(o, 'output', () => {
    console.log("OUTPUT--");
    if (!o.hash) return;
    const baseOutput = bscript.compile([
      OPS.OP_DUP,
      OPS.OP_HASH160,
      o.hash,
      OPS.OP_EQUALVERIFY,
      OPS.OP_CHECKSIG,
    ]);

    return baseOutput;
  });
  lazy.prop(o, 'pubkey', () => {
    if (!a.input) return;
    return _chunks()[1] as Buffer;
  });
  lazy.prop(o, 'signature', () => {
    if (!a.input) return;
    return _chunks()[0] as Buffer;
  });
  lazy.prop(o, 'input', () => {
    if (!a.pubkey) return;
    if (!a.signature) return;
    return bscript.compile([a.signature, a.pubkey]);
  });
  lazy.prop(o, 'witness', () => {
    if (!o.input) return;
    return [];
  });

  // extended validation
  if (opts.validate) {
    let hash: Buffer = Buffer.from([]);
    if (a.address) {
      if (_address().version !== network.pubKeyHash)
        throw new TypeError('Invalid version or Network mismatch');
      if (_address().hash.length !== 20) throw new TypeError('Invalid address');
      hash = _address().hash;
    }

    if (a.hash) {
      if (hash.length > 0 && !hash.equals(a.hash))
        throw new TypeError('Hash mismatch');
      else hash = a.hash;
    }

    if (a.output) {
      const hash2 = a.output.slice(3, 23);
      if (hash.length > 0 && !hash.equals(hash2))
        throw new TypeError('Hash mismatch');
      else hash = hash2;
    }

    if (a.pubkey) {
      const pkh = bcrypto.hash160(a.pubkey);
      if (hash.length > 0 && !hash.equals(pkh))
        throw new TypeError('Hash mismatch');
      else hash = pkh;
    }

    if (a.input) {
      const chunks = _chunks();
      if (chunks.length !== 2) throw new TypeError('Input is invalid');
      if (!bscript.isCanonicalScriptSignature(chunks[0] as Buffer))
        throw new TypeError('Input has invalid signature');
      if (!isPoint(chunks[1])) throw new TypeError('Input has invalid pubkey');

      if (a.signature && !a.signature.equals(chunks[0] as Buffer))
        throw new TypeError('Signature mismatch');
      if (a.pubkey && !a.pubkey.equals(chunks[1] as Buffer))
        throw new TypeError('Pubkey mismatch');

      const pkh = bcrypto.hash160(chunks[1] as Buffer);
      if (hash.length > 0 && !hash.equals(pkh))
        throw new TypeError('Hash mismatch');
    }
  }

  return Object.assign(o, a);
}
