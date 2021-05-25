pragma solidity^0.8;


import "./MulaToken.sol"; 
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MulaTokenCrowdSale  is Ownable{

    using SafeMath for uint256;
    address payable admin;
    MulaToken public _tokenContract;
    uint256 public _rate; //1MULA == 0.00001 ETH
    uint256 public _tokensSold =0;
    uint256 public _weiRaised;
    uint256  _tokensReamaining; 
    address payable  _wallet; 
    // Track investor contributions
    uint256 public investorMinCap = 2000000000000000; // 0.002 ether
    uint256 public investorHardCap = 50000000000000000000; // 50 ether

    mapping (address => uint256) _contributions;
    mapping (address => uint256) _receiving;
    uint numParticipants;
    // Crowdsale Stages
    enum CrowdsaleStage { PreICO_1,PreICO_2,PreICO_3, ICO,Paused,Ended }
    // Default to presale stage
    CrowdsaleStage public stage = CrowdsaleStage.Paused;
    mapping(CrowdsaleStage=> uint256) public CrowdsaleStageBalance;


    constructor(uint256 rate, address payable wallet, MulaToken token){
        //assign an admin
        admin =  payable (msg.sender);
        //link to token contract 
        _tokenContract = token;
        //token price 
        _rate = rate;
        //token wallet 
        _wallet = wallet;
        //set default stage balance 
        updateStage(4);
    }
    function participate(uint256 _numberOfTokens) public payable returns (bool success){
        uint256 giving = _numberOfTokens.mul(_rate);
        
        _preValidateParticipation(msg.value, giving, _numberOfTokens, msg.sender);
        //require that the transaction is successful 
        _processParticipation(msg.sender, _numberOfTokens);
        //record participant givings and receivings
        _updateParticipantBalance(msg.sender,giving,_numberOfTokens);
        //track number of tokens sold  and amount raised
        _tokensSold += _numberOfTokens;
        _weiRaised += giving;
        //subtract from crowdsale stage balance 
        _subFromCrowdsaleStageBalance(_numberOfTokens);
        return true;
    }
    //sets the ICO Stage, rates  and the CrowdsaleStageBalance 
    function updateStage(uint _stage)public onlyOwner returns (bool success){

         if(uint(CrowdsaleStage.PreICO_1) == _stage) {
          stage = CrowdsaleStage.PreICO_1;
          CrowdsaleStageBalance[stage]=5000000; //
          _rate = 100000000000000; //0.0001 eth == 500 eth
        } else if (uint(CrowdsaleStage.PreICO_2) == _stage) {
          stage = CrowdsaleStage.PreICO_2;
          CrowdsaleStageBalance[stage]=5000000;
           _rate = 200000000000000; //0.0002 eth
        }else if (uint(CrowdsaleStage.PreICO_3) == _stage) {
          stage = CrowdsaleStage.PreICO_3;
          CrowdsaleStageBalance[stage]=5000000;
           _rate = 500000000000000; //0.0005 eth
        }else if(uint(CrowdsaleStage.ICO) == _stage){
            stage = CrowdsaleStage.ICO;
          CrowdsaleStageBalance[stage]=5000000;
           _rate = 10000000000000000; //0.01 eth
        }else if(uint(CrowdsaleStage.Paused) == _stage){
            stage = CrowdsaleStage.Paused;
          CrowdsaleStageBalance[stage]=0;
          _rate = 0; //0.00 eth
        }else if(uint(CrowdsaleStage.Ended) == _stage){
            stage = CrowdsaleStage.Ended;
          CrowdsaleStageBalance[stage]=0;
          _rate = 0; //0.00 eth
        }


        return true;
    }
    function getStageBalance() public view returns (uint256) {
        return CrowdsaleStageBalance[stage];
    }
    function getParticipantGivings(address _participant) public view returns (uint256){
        return _contributions[_participant];
    }
    function getParticipantReceivings(address _participant) public view returns (uint256){
        return _receiving[_participant];
    }
    function _updateParticipantBalance(address _participant, uint256 _giving,uint256 _numOfTokens) internal{
        uint256 oldGivings = getParticipantGivings(_participant);
        uint256 oldReceivings = getParticipantReceivings(_participant);
        
        uint256 newGivings = oldGivings.add(_giving);
        uint256 newReceiving = oldReceivings.add(_numOfTokens);
        
        _contributions[_participant] = newGivings;
        _receiving[_participant] = newReceiving;
    }
    function _isIndividualCapped(address _participant, uint256 _weiAmount)  internal view returns (bool){
        uint256 _oldGiving = getParticipantGivings(_participant);
        uint256 _newGiving = _oldGiving.add(_weiAmount);
        require(_newGiving >= investorMinCap && _newGiving <= investorHardCap);
        return true;
    }

    function _addToCrowdsaleStageBalance(uint256 amount)  internal{
        uint256 currentBal = getStageBalance();
        uint256 newBal = currentBal.add(amount);
        CrowdsaleStageBalance[stage]=newBal;
    }
    function _subFromCrowdsaleStageBalance(uint256 amount)  internal{
        uint256 currentBal = getStageBalance();
        uint256 newBal = currentBal.sub(amount);
        CrowdsaleStageBalance[stage]=newBal;
    }
    function _preValidateParticipation(uint256 _sentValue, uint256 _requestedValue,uint256 _numberOfTokens, address _participant) internal view {
        //require that the value is equal to tokens 
        //||can also check that the giving value is not zero
        require(_sentValue == _requestedValue,'amount sent should be equal to giving per stage rate');
        //Require that contract has enough tokens 
        require(_tokenContract.balanceOf(address(this)) >= _numberOfTokens,'token requested not available');
        // require that the ico stage is not paused or ended 
        require(stage != CrowdsaleStage.Paused || stage !=CrowdsaleStage.Ended,'sale not in progress');
        // require that participant giving is between the caped range
        require(_isIndividualCapped(_participant,  _requestedValue),'request not within the cap range');
        // require that participant shoudl at anytime give above the minimum cap
        require(_requestedValue >= investorMinCap );
        this;
    }
    function _processParticipation(address recipient, uint256 amount) internal{
        require(_tokenContract.transfer(recipient, amount));
    }
    function r () public {
        _tokenContract.releaseTokenTransfer();
    }
}