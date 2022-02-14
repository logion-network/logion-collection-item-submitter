import { useState, useCallback, useEffect } from 'react';
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api';

import './App.css';

function App() {
  const [ url, setUrl ] = useState("");
  const [ signer, setSigner ] = useState("");
  const [ signerAddress, setSignerAddress ] = useState("");
  const [ collection, setCollection ] = useState("");
  const [ itemId, setItemId ] = useState("");
  const [ itemDescription, setItemDescription ] = useState("");
  const [ error, setError ] = useState(null);
  const [ submissionState, setSubmissionState ] = useState("");

  const submit = useCallback(() => {
    setError("");
    (async function() {
      const wsProvider = new WsProvider(url);
      const api = await ApiPromise.create({ provider: wsProvider, types: TYPES });
      const keyring = new Keyring({ type: 'sr25519' });
      const keyPair = keyring.addFromUri(signer);
      try {
        const unsub = await api.tx.logionLoc
          .addCollectionItem(collection, itemId, itemDescription)
          .signAndSend(keyPair, (result) => {
            setSubmissionState(`Current status is ${result.status}`);

            if (result.status.isInBlock) {
              setSubmissionState(`Transaction included at blockHash ${result.status.asInBlock}`);
            } else if (result.status.isFinalized) {
              setSubmissionState(`Transaction finalized at blockHash ${result.status.asFinalized}`);
              unsub();
            }
          });
      } catch(e) {
        setError(e.toString());
      }
    })();
  }, [
    url,
    signer,
    collection,
    itemId,
    itemDescription,
    setError,
    setSubmissionState
  ]);

  useEffect(() => {
    (async function() {
      const keyring = new Keyring({ type: 'sr25519' });
      const keyPair = keyring.addFromUri(signer);
      setSignerAddress(keyPair.address);
    })();
  }, [ signer, setSignerAddress ]);

  return (
    <div className="App">
      <h1><img src={process.env.PUBLIC_URL + "/logo.png"} alt="logo" /> Collection Item Submitter</h1>
      <p>This simple app shows how to submit a new item to a logion collection.</p>
      <form>
        <h2>Collection Settings</h2>
        <div className="form-row">
          <label htmlFor="url">Web Socket URL</label>
          <input
            id="url"
            type="text"
            value={ url }
            onChange={ e => setUrl(e.target.value) }
          />
          <p className="doc">The URL of a logion node, e.g. wss://test-rpc01.logion.network</p>
        </div>
        <div className="form-row">
          <label htmlFor="signer">Signer URI</label>
          <input
            id="signer"
            type="text"
            value={ signer }
            onChange={ e => setSigner(e.target.value) }
          />
          <p className="doc">Provide the mnemonic phrase of your Polkadot key pair or the hex seed in the form "0x" followed by 32 hexadecimal digits.</p>
        </div>
        <div className="form-row">
          <label htmlFor="signerAddress">Signer Address</label>
          <input
            id="signerAddress"
            type="text"
            value={ signerAddress }
            disabled
          />
          <p className="doc">This is the SS58 public address derived from above URI.</p>
        </div>
        <div className="form-row">
          <label htmlFor="collection">Collection ID</label>
          <input
            id="collection"
            type="text"
            value={ collection }
            onChange={ e => setCollection(e.target.value) }
          />
          <p className="doc">The Collection ID communicated by your legal officer.</p>
        </div>

        <h2>Item Data</h2>
        <div className="form-row">
          <label htmlFor="itemId">Item ID</label>
          <input
            id="itemId"
            type="text"
            value={ itemId }
            onChange={ e => setItemId(e.target.value) }
          />
          <p className="doc">A unique key for the item in the form "0x" followed by 32 hexadecimal digits e.g. the hex representation of a file's
          SHA256 hash.</p>
        </div>
        <div className="form-row">
          <label htmlFor="itemDescription">Item description</label>
          <textarea
            id="itemDescription"
            value={ itemDescription }
            onChange={ e => setItemDescription(e.target.value) }
          />
          <p className="doc">A string describing the item. The string must be at most 4096 UTF-8 encoded bytes long.</p>
        </div>

        <button type="button" onClick={ submit }>Submit</button>
        { submissionState && <p className="submission-state">Submission state: { submissionState }</p> }
        { error && <p className="error-message">Could not submit: { error }</p> }
      </form>
    </div>
  );
}

export default App;

const TYPES = {
  Address: "MultiAddress",
  LookupSource: "MultiAddress",
  PeerId: "(Vec<u8>)",
  AccountInfo: "AccountInfoWithDualRefCount",
  TAssetBalance: "u128",
  AssetId: "u64",
  AssetDetails: {
    owner: "AccountId",
    issuer: "AccountId",
    admin: "AccountId",
    freezer: "AccountId",
    supply: "Balance",
    deposit: "DepositBalance",
    max_zombies: "u32",
    min_balance: "Balance",
    zombies: "u32",
    accounts: "u32",
    is_frozen: "bool"
  },
  AssetMetadata: {
    deposit: "DepositBalance",
    name: "Vec<u8>",
    symbol: "Vec<u8>",
    decimals: "u8",
  },
  LocId: "u128",
  LegalOfficerCaseOf: {
    owner: "AccountId",
    requester: "Requester",
    metadata: "Vec<MetadataItem>",
    files: "Vec<File>",
    closed: "bool",
    loc_type: "LocType",
    links: "Vec<LocLink>",
    void_info: "Option<LocVoidInfo<LocId>>",
    replacer_of: "Option<LocId>",
    collection_last_block_submission: "Option<BlockNumber>",
    collection_max_size: "Option<CollectionSize>",
  },
  MetadataItem: {
    name: "Vec<u8>",
    value: "Vec<u8>",
    submitter: "AccountId"
  },
  LocType: {
    _enum: [
      "Transaction",
      "Identity",
      "Collection"
    ]
  },
  LocLink: {
    id: "LocId",
    nature: "Vec<u8>",
  },
  File: {
    hash: "Hash",
    nature: "Vec<u8>",
    submitter: "AccountId"
  },
  LocVoidInfo: {
    replacer: "Option<LocId>"
  },
  StorageVersion: {
    "_enum": [
      "V1",
      "V2MakeLocVoid",
      "V3RequesterEnum",
      "V4ItemSubmitter",
      "V5Collection"
    ]
  },
  Requester: {
    "_enum": {
      "None": null,
      "Account": "AccountId",
      "Loc": "LocId"
    }
  },
  CollectionSize: "u32",
  CollectionItemId: "Hash",
  CollectionItem: {
    description: "Vec<u8>"
  }
};
