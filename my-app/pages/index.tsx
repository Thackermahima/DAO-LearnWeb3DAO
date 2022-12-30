import Head from 'next/head'
import { useEffect,useState, useRef } from 'react'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '../styles/Home.module.css'
import Web3Modal from 'web3modal';
import {Contract, providers} from 'ethers';
import { formatEther } from "ethers/lib/utils";

import {
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
  CRYPTODEVS_NFT_CONTRACT_ADDRESS,
  CRYPTODEVS_DAO_ABI,
  CRYPTODEVS_NFT_ABI,
} from '../constants';

const inter = Inter({ subsets: ['latin'] })

const Home  = () => {
  const[walletConnected, setWalletConnected] = useState<Boolean>(false);
  const[isOwner, setIsOwner] = useState<Boolean>(false);
  const[isLoading, setLoading] = useState<Boolean>(false);
  //ETH balance of the Dao Contract 
  const[treasuryBalance, setTreasuryBalance] = useState("0");

  //Number of proposal created in the Dao contract.
  const[numProposals, setNumProposals] = useState<number | string>("0");
  //Array of all proposals created in the DAO.
  const[proposals, setProposals] = useState<any | void[]>([]);

  //Users balance of CryptoDevs NFTs
  const[nftBalance, setNFTBalance] = useState<number | string>("0");

  //Fake NFT TokenId to purchase, Used when creating a proposal.
  const [fakeNFTTokenId, setFakeNFTTokenId] = useState("");

  //Create proposal | View proposal.
  const[selectedTab, setSelectedTab] = useState("");

  const web3ModalRef = useRef<any>();
  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error,"Error");
      
    }
  }
  const getProviderOrSigner = async(needSigner = false) => {
  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);
  const { chainId } = await web3Provider.getNetwork();
  if(chainId !== 5){
    window.alert("Please switch to the Goerli network!");
    throw new Error("Please switch to the Goerli network");
  }
  if(needSigner){
    const signer =  web3Provider.getSigner();
    return signer
  }
  return web3Provider;
  }
  //GetDaoOwner
  const getDAOOwner = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = await getDaoContractInstance(signer);

      const _owner = await contract.owner();
      const address = await signer.getAddress();
      if(address.toLowerCase() == _owner.toLowerCase()){
        setIsOwner(true);
      }

    } catch (error) {
      console.log(error,"error");
      
    }
  }
  //Withraws ether by calling the withdraw function in the contract.
  const withdrawDAOEther = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = await getDaoContractInstance(signer);
      const tx = await contract.withdraweEther();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getDAOTreasuryBalance();
    } catch (error) {
      console.log(error,"Error from withdraw");
    }
  }
  const getDAOTreasuryBalance = async() => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        CRYPTODEVS_DAO_CONTRACT_ADDRESS
      );
    setTreasuryBalance(balance.toString());
    } catch (error) {
      console.log(error,"Error from getDAOTreasuryBalance");
      
    }
  }
  const getNumProposalsInDAO = async() => {
    try {
      const provider = await getProviderOrSigner();
      const contract = await getDaoContractInstance(provider);
      const daoNumProposals = await contract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.log(error,"getNumProposals");
    }
  }
  //Reads the balance of the user's CryptoDevs NFT and sets the nftBalance state variable.

  const getUserNFTBalance = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = await getCryptoDevsNFTContractInstance(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNFTBalance(parseInt(balance.toString()));

    } catch (error) {
      console.log(error,"getUserNFTBalance");
      
    }
  }
  //Calls the `CreateProposal` functions in the contract using the tokenId from fakeNftTokenId
  const createProposal = async() => {
    try {
    const signer = await getProviderOrSigner(true);
    const daoContract = await getDaoContractInstance(signer);
    const txn = await daoContract.createProposal(fakeNFTTokenId);
    setLoading(true);
    await txn.wait();
    await getNumProposalsInDAO();
    setLoading(false);
    } catch (error) {
      console.log(error,"error");
      
    }
    
  }
  type ParsedProposal ={
    proposalId: number,
    nftTokenId: string,
    deadline: Date,
    yayVotes: string,
    nayVotes: string,
    executed: boolean
  }

  const fetchProposalId = async(id : number) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = await getDaoContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal : ParsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;
    } catch (error) {
      console.log(error, "error fetchProsalId");
      
    }
  }
  const fetchAllProposals = async() => {
    try {
      const proposals : any[]  = [];
      for(let i = 0; i < numProposals; i++){
         const proposal : any = await fetchProposalId(i);
         proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.log(error,"error from fetchAllProposals");
    }
  }
  //Call the voteOnProposal func in the contract using the passed proposal Id and Vote.
  const voteOnProposal = async (proposalId : number, _vote : (number | string)) =>{
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = await getDaoContractInstance(signer);
      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals()

    } catch (error) {
      console.log(error,"Error in voteOnProposal");
      
    }
  }
  //Call the executeProposal function in the contract using the passed proposal Id.

const executeProposals = async(proposalId : number) => {
try {
  const signer = await getProviderOrSigner(true);
  const daoContract = await getDaoContractInstance(signer);
  const txn = await daoContract.executeProposal(proposalId);
  setLoading(true);
  await txn.wait();
  setLoading(false);
  await fetchAllProposals();
  getDAOTreasuryBalance();

} catch (error) {
  console.log(error,"Error from executeProposal")
}
}
const getDaoContractInstance = async(providerOrSigner : any) => {
return new Contract(
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
  CRYPTODEVS_DAO_ABI,
  providerOrSigner
)
}

const getCryptoDevsNFTContractInstance = async(providerOrSigner : any) => {
  return new Contract(
    CRYPTODEVS_NFT_CONTRACT_ADDRESS,
    CRYPTODEVS_NFT_ABI,
    providerOrSigner
  )
}
  useEffect(() => {
 if(!walletConnected){
  web3ModalRef.current = new Web3Modal({
    network : "goerli",
    providerOptions : {},
    disableInjectedProvider : false
  })
   connectWallet().then(() => {
    getDAOTreasuryBalance();
    getUserNFTBalance();
    getNumProposalsInDAO();
    getDAOOwner();
   })
 }
  },[walletConnected]);

  useEffect(() => {
    if(selectedTab === "View Proposals"){
      fetchAllProposals();
    }
  }, [selectedTab]);
  function renderTab() {
    if(selectedTab === "Create Proposal"){
     return renderCreateProposalsTab();
    } else if( selectedTab === "View Proposals"){
      return renderViewProposalsTab();
    }
    return null;
  }
//Renders the "Create Proposals" tab content.

  const renderCreateProposalsTab = async() => {
    if(isLoading){
      return(
        <div className={styles.description}>Loading..</div>
      );
    } else if(nftBalance === 0){
      return (
        <div className={styles.description}>
          <>
          You do not own any CryptoDevs NFTs.<br />
          <b>You cannot create or vote on proposals</b>
          </>
        </div>
      );
    } else {
      return (
        <div className= {styles.container}>
         <label>Fake NFT Token ID to Purchase</label>
         <input type="number" placeholder="0" onChange={(e) => setFakeNFTTokenId(e.target.value)} />
         <button className={styles.button2} onClick = {createProposal}> Create</button>
        </div>
      );
    }
  }

  //Renders "View Proposals" Tab content.

  const renderViewProposalsTab = () => {
  if(isLoading){
    return(
      <div className={styles.description}>
        Loading...Waiting for transaction..
      </div>
    );
  } else if (proposals.length === 0){
    return(
      <div className={styles.description}>No Proposals have been created</div>
    );
  } else {
    return(
      <div>
        {proposals.map((p : any, index : number) => {
       <div key={index} className={styles.proposalCard}>
        <p>Proposal ID: {p.proposalId}</p>
        <p>Fake NFT to Purchase: {p.nftTokenId}</p>
        <p>Deadline: {p.deadline.toLocaleString()}</p>
        <p>Yay Votes: {p.yayVotes}</p>
        <p>Nay Votes: {p.nayVotes}</p>
        <p>Executed:{p.executed.toString()}</p>
        {p.deadline.getTime() > Date.now() && !p.executed ? (
          <div className={styles.flex}>
           <button className={styles.button2} onClick = { () => voteOnProposal(p.proposalId,"YAY")}>
            Vote YAY
           </button>
           <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId,"NAY")}>
            Vote NAY
           </button>
          </div>
        ): p.deadline.getTime() < Date.now() && !p.executed ? (
          <div className={styles.flex}>
           <button className={styles.button2} onClick = { () => executeProposals(p.proposalId)}>
            Execute Proposal{""}
            {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
           </button>
          </div>
        ): (
          <div className={styles.description}>Proposal Executed</div>
        )}
       </div>
        })}
      </div>
    )
  }
  }
  return(
  <div>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name='description' content='CryptoDevs DAO' ></meta>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className={styles.main} >
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs</h1>
          <div className={styles.description}>Welcome to the DAO!</div>

          <div className={styles.description}>
            <>
            Your cryptodevs NFT balance: {nftBalance}
            <br />
            Treasury balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of proposals: {numProposals.toString()}
            <div className={styles.flex}>
              <button className={styles.button} onClick={() => setSelectedTab("Create Proposal")}>
                Create Proposal
              </button>
              <button
                className={styles.button}
                onClick={() => setSelectedTab("View Proposals")}
              >
                View Proposals
              </button>
            </div>

            {renderTab()}

            {isOwner ? (
              <div>
                {isLoading ? <button className={styles.button}>Loading...</button>
                  : <button className={styles.button} onClick={withdrawDAOEther}>
                    Withdraw DAO ETH
                  </button>
                }
              </div>
            ) : ""}
          </>

          </div>

          <div>
            <img className={styles.image} src="./0.svg" />
          </div>

        </div>

      </div>
      <footer className={styles.footer}>
        Made with &#10084;
      </footer>
    </div>
  
  )
}
export default Home;
