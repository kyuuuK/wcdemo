import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import SignClient from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import { Web3Modal } from "@web3modal/standalone";
import { clientConnect, getChainConnectMetadata, updateSession, walletConnectClientInitialize, web3ModalInitialize } from './module';
import { PairingTypes } from "@walletconnect/types";

const projectId = process.env.REACT_APP_PTJ_ID as string;
function App() {

  const [client, setClient] = useState<SignClient | undefined>();
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | undefined>();
  const [sessionState, setSessionState] = useState<SessionTypes.Struct | undefined>();
  const [pairings, serPairings] = useState<PairingTypes.Struct[] | undefined>();

  useEffect(() => {
    initialize();
  }, []);
  const initialize = async () => {
    try {
      const client = await walletConnectClientInitialize({ projectId, relayUrl: 'wss://relay.walletconnect.com' });
      const modal = web3ModalInitialize({ projectId });
      setClient(client);
      setWeb3Modal(modal);
    } catch (err) {
      console.log(err);
    }
  }

  const connectWC = async (chainId: string) => {
    try {
      if (!client || !web3Modal) throw Error();
      const connectRequestTargetChainId = [chainId];

      const chainNameSpace = getChainConnectMetadata(connectRequestTargetChainId);
      const session: SessionTypes.Struct = await clientConnect({
        chainNameSpace: chainNameSpace,
        client: client,
        web3Modal: web3Modal,
        pairing: pairings ? pairings[pairings.length - 1] : undefined,
      });
      setSessionState(session);
      serPairings(client.pairing.getAll({ active: true }));
    } catch (err) {

    }
  };

  const updateWC = async () => {
    try{

      if(!client || !sessionState) return;
      const [,,account] = sessionState.namespaces['eip155'].accounts[0].split(':');
      
      updateSession({
        account,
        client,
        session : sessionState
      })
    }catch(err){
      console.log(err);
    }
  };

  const connectOrUpdateWC = (chainId: string) => {
    if (sessionState) {
      updateWC()
    } else {
      connectWC(chainId)
    }
  }
  
  return (
    <>
      <button onClick={() => connectOrUpdateWC('eip155:1')}>connectWC - eth</button>
      <button onClick={() => connectOrUpdateWC('eip155:137')}>connectWC - pol</button>
      {sessionState?.topic}
    </>
  );
}

export default App;



