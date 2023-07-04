import { loadSync as loadEnvSync } from "https://deno.land/std/dotenv/mod.ts"
import { JsonRpcProvider, Connection, SuiEvent } from 'npm:@mysten/sui.js';
import { ApiPromise, HttpProvider, Keyring, WsProvider } from "https://deno.land/x/polkadot/api/mod.ts"
import { KeyringPair } from "https://deno.land/x/polkadot/keyring/types.ts";
import { cryptoWaitReady, encodeAddress, blake2AsU8a, secp256k1Compress } from "https://deno.land/x/polkadot/util-crypto/mod.ts"
import { SubmittableExtrinsic } from "https://deno.land/x/polkadot/api/submittable/types.ts";
import { ISubmittableResult } from "https://deno.land/x/polkadot/types/types/extrinsic.ts";


// Construct your connection:
const connection = new Connection({
	websocket: 'wss://fullnode.testnet.sui.io',
	faucet: 'https://faucet.testnet.sui.io/gas',
});
// connect to Testnet
const provider = new JsonRpcProvider(connection);

const promptPackage = '0x86e2ab6c370fbfed0ee955158ca95ca5b465dede4a79eb3594d2959e72d3d62a';
const promptFilter = { MoveModule: { package: promptPackage, module: 'cybrosnetwork' } };

const env = loadEnvSync();
const jobPoolId = env.JOB_POOL_ID
const jobPolicyId = env.JOB_POLICY_ID
const jobSpecVersion = env.JOB_SPEC_VERSION

await cryptoWaitReady().catch((e) => {
    console.error(e.message);
    Deno.exit(1);
});
  
const subOperatorKeyPair: KeyringPair = (() => {
    const operatorMnemonic = env.SUB_OPERATOR_MNEMONIC;
    if (operatorMnemonic === undefined || operatorMnemonic === "") {
          console.error("Mnemonic is blank")
      Deno.exit(1)
    }
  
    try {
      return new Keyring({ type: "sr25519" }).addFromUri(operatorMnemonic, { name: "The operator" });
    } catch (e) {
      console.error(`Operator mnemonic invalid: ${e.message}`);
      Deno.exit(1)
    }
})();
console.log(`Operator: ${subOperatorKeyPair.address}`);

function createSubstrateApi(rpcUrl: string): ApiPromise | null {
    let provider = null;
    if (rpcUrl.startsWith("wss://") || rpcUrl.startsWith("ws://")) {
      provider = new WsProvider(rpcUrl);
    } else if (
      rpcUrl.startsWith("https://") || rpcUrl.startsWith("http://")
    ) {
      provider = new HttpProvider(rpcUrl);
    } else {
      return null;
    }
  
    return new ApiPromise({
      provider,
      throwOnConnect: true,
      throwOnUnknown: true,
    });
}

const api = createSubstrateApi(env.SUB_NODE_RPC_URL);
if (api === null) {
  console.error(`Invalid RPC URL "${env.SUB_NODE_RPC_URL}"`);
  Deno.exit(1);
}

api.on("error", (e) => {
  console.error(`Polkadot.js error: ${e.message}"`);
  Deno.exit(1);
});

await api.isReady.catch((e) => console.error(e));

const promptSub = await provider.subscribeEvent({
  filter: promptFilter,
  onMessage: async (event: SuiEvent) =>{
    // handle subscription notification message here
    console.log(event["parsedJson"]["data"]);
    const prompt = event["parsedJson"]["data"].toString().trim();
    if (prompt.length === 0) {
      console.info("Prompt is blank, skip")
      return []
    };
    const input = {e2e: false, data: prompt};
    const txPromise = api.tx.offchainComputing.createJob(jobPoolId, jobPolicyId, jobSpecVersion, false, JSON.stringify(input), null);
    console.info(`Sending offchainComputing.createJob(poolId, policyId, implSpecVersion, input, softExpiresIn) in batch`);
    console.info(`Call hash: ${txPromise.toHex()}`);
    const txHash = await txPromise.signAndSend(subOperatorKeyPair, { nonce: -1 });
    console.info(`Transaction hash: ${txHash.toHex()}`);
  },
});

