export type Network={id:number;name:string;shortName:string;nativeCurrency:string;rpcEnv:string;explorer:string;testnet:boolean};
export const NETWORKS:Network[]=[
{id:1,name:'Ethereum',shortName:'ETH',nativeCurrency:'ETH',rpcEnv:'ETHEREUM_RPC_URL',explorer:'https://etherscan.io',testnet:false},
{id:11155111,name:'Ethereum Sepolia',shortName:'SEP',nativeCurrency:'ETH',rpcEnv:'SEPOLIA_RPC_URL',explorer:'https://sepolia.etherscan.io',testnet:true},
{id:137,name:'Polygon',shortName:'POL',nativeCurrency:'POL',rpcEnv:'POLYGON_RPC_URL',explorer:'https://polygonscan.com',testnet:false},
{id:80002,name:'Polygon Amoy',shortName:'AMOY',nativeCurrency:'POL',rpcEnv:'POLYGON_AMOY_RPC_URL',explorer:'https://amoy.polygonscan.com',testnet:true},
{id:8453,name:'Base',shortName:'BASE',nativeCurrency:'ETH',rpcEnv:'BASE_RPC_URL',explorer:'https://basescan.org',testnet:false},
{id:84532,name:'Base Sepolia',shortName:'BASE-S',nativeCurrency:'ETH',rpcEnv:'BASE_SEPOLIA_RPC_URL',explorer:'https://sepolia.basescan.org',testnet:true},
{id:42161,name:'Arbitrum One',shortName:'ARB',nativeCurrency:'ETH',rpcEnv:'ARBITRUM_RPC_URL',explorer:'https://arbiscan.io',testnet:false},
{id:421614,name:'Arbitrum Sepolia',shortName:'ARB-S',nativeCurrency:'ETH',rpcEnv:'ARBITRUM_SEPOLIA_RPC_URL',explorer:'https://sepolia.arbiscan.io',testnet:true},
{id:10,name:'Optimism',shortName:'OP',nativeCurrency:'ETH',rpcEnv:'OPTIMISM_RPC_URL',explorer:'https://optimistic.etherscan.io',testnet:false},
{id:11155420,name:'Optimism Sepolia',shortName:'OP-S',nativeCurrency:'ETH',rpcEnv:'OPTIMISM_SEPOLIA_RPC_URL',explorer:'https://sepolia-optimism.etherscan.io',testnet:true},
];
export const getNetwork=(id:number)=>NETWORKS.find(n=>n.id===id);
export const enabledNetworks=()=>NETWORKS.filter(n=>Boolean(process.env[n.rpcEnv]));
