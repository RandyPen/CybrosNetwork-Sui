import { Secp256k1Keypair } from 'npm:@mysten/sui.js';
import { blake2b } from 'npm:@noble/hashes/blake2b';
import { fromB64, toB64 } from 'npm:@mysten/bcs';
import { bytesToHex } from 'npm:@noble/hashes/utils';

const SUI_ADDRESS_LENGTH = 32;
const SECP256K1_PUBLIC_KEY_SIZE = 33;

type PublicKeyInitData = string | Uint8Array | Iterable<number>;

const keypair = new Secp256k1Keypair();
console.log(keypair);


function toSuiAddress(value: PublicKeyInitData): string {
    let tmp = new Uint8Array(SECP256K1_PUBLIC_KEY_SIZE + 1);
    let data = new Uint8Array();

    if (typeof value === 'string') {
        data = fromB64(value);
    } else if (value instanceof Uint8Array) {
        data = value;
    } else {
        data = Uint8Array.from(value);
    }

    if (data.length !== SECP256K1_PUBLIC_KEY_SIZE) {
        throw new Error(
            `Invalid public key input. Expected ${SECP256K1_PUBLIC_KEY_SIZE} bytes, got ${data.length}`,
        );
    }

    tmp.set([0x01]);  // Secp256k1 Flag
    tmp.set(data, 1);
    // Each hex char represents half a byte, hence hex address doubles the length
	return normalizeSuiAddress(
		bytesToHex(blake2b(tmp, { dkLen: 32 })).slice(0, SUI_ADDRESS_LENGTH * 2),
	);
}

/**
 * Perform the following operations:
 * 1. Make the address lower case
 * 2. Prepend `0x` if the string does not start with `0x`.
 * 3. Add more zeros if the length of the address(excluding `0x`) is less than `SUI_ADDRESS_LENGTH`
 *
 * WARNING: if the address value itself starts with `0x`, e.g., `0x0x`, the default behavior
 * is to treat the first `0x` not as part of the address. The default behavior can be overridden by
 * setting `forceAdd0x` to true
 *
 */
function normalizeSuiAddress(value: string, forceAdd0x: boolean = false): string {
	let address = value.toLowerCase();
	if (!forceAdd0x && address.startsWith('0x')) {
		address = address.slice(2);
	}
	return `0x${address.padStart(SUI_ADDRESS_LENGTH * 2, '0')}`;
}


let address = toSuiAddress(keypair.getPublicKey()["data"]);
console.log(address);
