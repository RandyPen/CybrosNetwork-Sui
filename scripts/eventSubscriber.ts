// import { JsonRpcProvider, testnetConnection, SuiEvent } from 'npm:@mysten/sui.js';

import { JsonRpcProvider, Connection, SuiEvent } from 'npm:@mysten/sui.js';

// Construct your connection:
const connection = new Connection({
	fullnode: 'wss://fullnode.testnet.sui.io',
	faucet: 'wss://faucet.testnet.sui.io/gas',
});
// connect to Testnet
const provider = new JsonRpcProvider(connection);

const promptPackage = '0x86e2ab6c370fbfed0ee955158ca95ca5b465dede4a79eb3594d2959e72d3d62a';
const promptFilter = { MoveModule: { package: promptPackage, module: 'cybrosnetwork' } };
const promptSub = await provider.subscribeEvent({
    filter: promptFilter,
    onMessage(event: SuiEvent) {
      // handle subscription notification message here
      console.log(event["parsedJson"]);
    },
  });

