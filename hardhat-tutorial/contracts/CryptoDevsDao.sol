//SPDX-License-Identifier:MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/access/Ownable.sol";


interface IFakeNftMarketplace {
    function purchase(uint256 _tokenId) external payable;

    function getPrice() external view returns (uint256);

    function available(uint256 _tokenId) external view returns (bool);
}

interface ICryptoDevsNFT {
    function balanceOf(address owner) external view returns (uint256);

    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) external view returns (uint256);
}

contract CryptoDevsDao is Ownable {

    enum Vote{
        YAY,
        NAY
    }
    struct Proposal {
        //To buy NFT from secoundary marketplace
        uint256 nftTokenId;
        //When does voting ends
        uint256 deadline;
        //Yes votes
        uint256 yayVotes;
        //No Votes
        uint256 nayVotes;
        bool executed;
        mapping(uint256 => bool) voters;
    }
    //ProposalId => Proposal
    mapping(uint256 => Proposal) proposals;
    uint256 public numProposals;
    IFakeNftMarketplace nftMarketplace;
    ICryptoDevsNFT cryptoDevsNFT;

    constructor(address _nftMarketplace, address _cryptoDevsNFT)payable{
        nftMarketplace = IFakeNftMarketplace(_nftMarketplace);
        cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
    }
    modifier nftHolderOnly(){
    require(cryptoDevsNFT.balanceOf(msg.sender) > 0,"NOT_A_DAO_MEMBER");
    _;
    }
    modifier activeProposalOnly(uint256 proposalId){
        require(proposals[proposalId].deadline > block.timestamp,"PROPOSAL_INACTIVE");
        _;
    }
    modifier inactiveProposalOnly(uint256 proposalId) {
        require(proposals[proposalId].deadline <= block.timestamp,"PROPOSAL_ACTIVE");
        require(proposals[proposalId].executed == false,"ALREADY_EXECUTED");
        _;
    }
    //Create a proposal --> MemberOnly
    //_nftTokenId referes to the NFT you want to buy from FakeNFTMarketplace
    //returns ID of Newly created NFT

    function createProposal(uint256 _nftTokenId) external nftHolderOnly returns(uint256){
      require(nftMarketplace.available(_nftTokenId), "NFT_NOT_FOR_SALE");
      Proposal storage proposal = proposals[numProposals];
      proposal.nftTokenId = _nftTokenId;
      proposal.deadline = block.timestamp + 5 minutes;

      numProposals++;
      return numProposals - 1;
      
    }
    //Vote a proposal --> MemberOnly
    function voteOnProposal(uint256 proposalId, Vote vote)  external nftHolderOnly activeProposalOnly(proposalId){
    Proposal storage proposal  = proposals[proposalId];
    uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);
     uint256 numVotes;
     for(uint256 i = 0; i < voterNFTBalance; ++i){
        uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
        if(proposal.voters[tokenId] == false){
            numVotes++;
            proposal.voters[tokenId] = true;
        }
     }
    require(numVotes > 0,"ALREADY_VOTED");
    if(vote == Vote.YAY){
         proposal.yayVotes += numVotes;
    }else{
        proposal.nayVotes += numVotes;
    }
    }
    //Execute a proposal -->memberOnly
    function executeProposal(uint256 proposalId) external nftHolderOnly inactiveProposalOnly(proposalId){
     Proposal storage proposal = proposals[proposalId];

     //Did the proposal pass?
     if(proposal.yayVotes > proposal.nayVotes){
        uint256 nftPrice = nftMarketplace.getPrice();
        require(address(this).balance >= nftPrice,"NOT_ENOUGH_FUNDS");
        nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);

     }
     proposal.executed = true;
    }
    function withdraweEther() external onlyOwner{
        payable(owner()).transfer(address(this).balance);
    }
    receive() external payable{}
    fallback() external payable{}
}
