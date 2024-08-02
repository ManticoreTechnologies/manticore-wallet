interface Wallet {
    mnemonic: string;
    seed: string;
}
interface Address {
    address: string | undefined,
    privateKey: string,
    hdkeypath: string,
    label?: string
    balance: number,
    received: number,
}
type Addresses = Address[]