import SignClient from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import { Web3Modal } from "@web3modal/standalone";
import { PairingTypes } from "@walletconnect/types";


export interface InitiallizeRootRequest {
  projectId: string;
}

export interface ClientInitializeRequest extends InitiallizeRootRequest {
  relayUrl: string;
}

export interface Web3ModalInitializeRequest extends InitiallizeRootRequest {
  walletConnectVersion?: 1 | 2;
}

export interface ClientConnectRequest {
  client: SignClient;
  chainNameSpace: Record<string, { chains?: string[]; methods: string[]; events: string[]; }>;
  web3Modal: Web3Modal;
  pairing?: PairingTypes.Struct
}


export const walletConnectClientInitialize = async (request: ClientInitializeRequest): Promise<SignClient> => {
  const { projectId, relayUrl } = request;

  const client = await SignClient.init({
    projectId,
    relayUrl,
    metadata: {
      name: "demo",
      description: "React App for WalletConnect",
      url: "demo",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    }
  });
  return client;
};

export const web3ModalInitialize = (request: Web3ModalInitializeRequest): Web3Modal => {
  const { projectId, walletConnectVersion = 2 } = request;

  const web3Modal = new Web3Modal({
    projectId: projectId,
    themeMode: "light",
    walletConnectVersion,
    themeVariables: {
      '--w3m-z-index': '9999'
    }
  });
  return web3Modal;
};

export const clientConnect = async (request: ClientConnectRequest) => {
  const { chainNameSpace, client, web3Modal, pairing = undefined } = request;
  try {
    
    const { uri, approval } = await client.connect({
      requiredNamespaces: chainNameSpace
    });

    if (uri) {
      const standaloneChains = Object.values(chainNameSpace)
        .map((namespace) => namespace.chains)
        .flat() as string[];

      web3Modal.openModal({ uri, standaloneChains });
    }
    const session: SessionTypes.Struct = await approval();
    
    web3Modal.closeModal();
    return session;
  } catch (err) {
    throw err;
  }

};


export const getChainConnectMetadata = (chains: string[]) => {

  let chainNameSpaceIdBuilder: string[] = [];
  let convertedChainId: string[] = [];
  for (const chain of chains) {
    const [namespace] = chain.split(':');
    if (!(chainNameSpaceIdBuilder.includes(namespace))) {
      chainNameSpaceIdBuilder.push(namespace);
    }
    convertedChainId.push(chain)
  }

  const buildedNameSpace = Object.fromEntries(
    chainNameSpaceIdBuilder.map((name) => {
      return [
        name,
        {
          methods: getChainMethod(name),
          events: getChainEvent(name),
          chains: convertedChainId.filter(chain => chain.startsWith(name))
        }
      ]
    })

  )

  return buildedNameSpace;
}

const getChainMethod = (chainType: string) => {
  switch (chainType) {
    case 'eip155':
      return [
        "eth_sendTransaction",
        "personal_sign",
      ]
    case 'solana':
      return [
        "solana_signTransaction",
        "solana_signMessage",
      ];
    default:
      return [];
  }
}

const getChainEvent = (chainType: string) => {
  switch (chainType) {
    case 'eip155':
      return [
        "chainChanged",
        "accountsChanged"
      ]
    default:
      return [];
  }
}


export interface UpdateSessionRequest {
  client: SignClient;
  session: SessionTypes.Struct;
  account : string;
}

export const updateSession = async (props: UpdateSessionRequest) => {
  try{

    const { client, session,account } = props;
    const newNamespace = {
      eip155: {
        accounts: [
          `eip155:1:${account}`,
          `eip155:137:${account}`,
        ],
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",
        ],
        events: ["chainChanged", "accountsChanged"],
      },
    };
    await client.update({ topic: session.topic, namespaces: newNamespace })
  }catch(err){
    console.log(err);
  }

};