pragma solidity^0.8;


import "./MulaToken.sol"; 
import "./MulaInvestorsVault.sol"; 
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract MulaTokenCrowdSale  is Ownable{
    /**
    * @Legend: CrowdsalePeriodExtended = CPE
    * @Legend: CrowdsaleOperationFinished = COF
    */
    using SafeMath for uint256;
    address payable admin;
    MulaToken public _tokenContract;
    MulaInvestorsVault public _vaultContract;
    uint256 public _rate; //1MULA == 0.0095 usd
    uint256 public _tokensSold;
    uint256 public _weiRaised;
    uint256  _tokensReamaining; 
    address payable  _wallet; 

    uint256 _startTime;
    uint256 _endTime;
    bool private _finalized;
    event COF();
    event CPE(uint256 oldEndTime, uint256 newEndTime);
    // Crowdsale Stages
    enum CrowdsaleStage { PreSale,PrivateSale,PublicSale_1, PublicSale_2,Paused,Ended }
    // Default to presale stage
    CrowdsaleStage public stage = CrowdsaleStage.Paused;
    // Track investor contributions
    uint256 public investorMinCap;
    uint256 public investorHardCap;
    uint256  mulaHardCap = 25000000;
    uint256  mulaSoftCap = 5000000;

    mapping(CrowdsaleStage=> mapping(address => uint256)) _contributions;
    mapping(CrowdsaleStage=> mapping(address => uint256)) _receiving;
    mapping(CrowdsaleStage=> uint256) public CrowdsaleStageBalance;

    uint numParticipants;

    AggregatorV3Interface internal ETHUSD;
    AggregatorV3Interface internal BNBUSD;

    address ETHUSD_Aggregator = 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e;
    address BNBUSD_Aggregator = 0xcf0f51ca2cDAecb464eeE4227f5295F2384F84ED;

    address payable _DevMarketing;
    address payable _FounderFund1;
    address payable _FounderFund2;
    address payable _ListingLiquidity;
    address payable _OperationsManagement;

    uint256 public _DevMarketingPercentage = 8;
    uint256 public _FounderFund1Percentage = 9;
    uint256 public _FounderFund2Percentage = 9;
    uint256 public _ListingLiquidityPercentage = 20;
    uint256 public _OperationsManagementPercentage =4;

    uint256 public _DevMarketing_percentPerReleaseInterval = 5;
    uint256 public _FounderFund1_percentPerReleaseInterval = 20;
    uint256 public _FounderFund2_percentPerReleaseInterval = 20;
    uint256 public _ListingLiquidity_percentPerReleaseInterval = 10;
    uint256 public _OperationsManagement_percentPerReleaseInterval =100;

    uint256 public _DevMarketing_ReleaseInterval = 1; //monthly 
    uint256 public _FounderFund1_ReleaseInterval = 3; //every 3 month
    uint256 public _FounderFund2_ReleaseInterval = 3; //every 3 month
    uint256 public _ListingLiquidity_ReleaseInterval = 1; //monthly
    uint256 public _OperationsManagement_ReleaseInterval =1;

    uint256 public _DevMarketing_TotalDur = 20; //held for 20 month space
    uint256 public _FounderFund1_TotalDur = 15;
    uint256 public _FounderFund2_TotalDur = 15;
    uint256 public _ListingLiquidity_TotalDur = 10;
    uint256 public _OperationsManagement_TotalDur =1;

    uint256 public _DevMarketing_ID = 8976; //held for 20 month space
    uint256 public _FounderFund1_ID = 7654;
    uint256 public _FounderFund2_ID = 1509;
    uint256 public _ListingLiquidity_ID = 6609;
    uint256 public _OperationsManagement_ID =7654;

    /**
     * @dev Reverts if not in crowdsale time range.
     */
    modifier onlyWhileOpen {
        require(isOpen(), "Crowdsale: not open");
        _;
    }


    constructor(
                MulaToken token,
                MulaInvestorsVault vault,
                uint256 startingTime,
                uint256 endingTime,
                address payable wallet,
                address payable DevMarketing,
                address payable FounderFund1,
                address payable FounderFund2, 
                address payable ListingLiquidity,
                address payable OperationsManagement
                )
    Ownable()
    {
        // 
        require(startingTime >= block.timestamp, "Crowdsale: start time is before current time");
        //
        require(endingTime > startingTime, "Crowdsale: start time is invalid");
        //assign an admin
        admin =  payable (msg.sender);
        //link to token contract 
        _tokenContract = token;
        //link to token contract 
        _vaultContract = vault;
        //token wallet 
        _wallet = wallet;
        //set default stage balance 
        updateStage(4);
        ETHUSD = AggregatorV3Interface(ETHUSD_Aggregator);
        BNBUSD = AggregatorV3Interface(BNBUSD_Aggregator);

        _startTime = startingTime;
        _endTime = endingTime;
        _finalized = false;

        _DevMarketing = DevMarketing;
        _FounderFund1 = FounderFund1;
        _FounderFund2 = FounderFund2;
        _ListingLiquidity = ListingLiquidity;
        _OperationsManagement = OperationsManagement;
    }
    function participatEth(uint80 _roundId)payable public onlyWhileOpen returns (bool success){
        
        uint256 _numberOfTokens = _mulaReceiving(msg.value,_roundId);
        
        _preValidateParticipation(msg.value, _numberOfTokens, msg.sender);
        //require that the transaction is successful 
        _processParticipation(msg.sender, _numberOfTokens);
        //record participant givings and receivings
        _updateParticipantBalance(msg.sender,msg.value,_numberOfTokens);
        //track number of tokens sold  and amount raised
        _tokensSold += _numberOfTokens;
        _weiRaised += msg.value;
        //subtract from crowdsale stage balance 
        _subFromCrowdsaleStageBalance(_numberOfTokens);
        return true;
    }
    function _mulaReceiving(uint256 _weiSent, uint80 _roundId) internal view returns (uint256 ){
        int _ethUsdRate =  getTheETHUSDPrice(_roundId);
        int _ethMulRate = int(_rate)/(_ethUsdRate/100000000);
        uint256 _weiMulRate =  uint256((_ethMulRate * 10 **18 )/100000000);
        uint256 tempR = _weiSent.div(_weiMulRate) ;

        return tempR * 10 ** 18;
    }
    //sets the ICO Stage, rates  and the CrowdsaleStageBalance 
    function updateStage(uint _stage)public onlyOwner returns (bool success){

         if(uint(CrowdsaleStage.PreSale) == _stage) {
          stage = CrowdsaleStage.PreSale;
          CrowdsaleStageBalance[stage]=9000000 * (10**18) ; //
          investorMinCap   = 0.1 * (10**18);
          investorHardCap  = 1.5 * (10**18);
          _rate = 0.0095 * (10**8); //usd 
        } else if (uint(CrowdsaleStage.PrivateSale) == _stage) {
          stage = CrowdsaleStage.PrivateSale;
          CrowdsaleStageBalance[stage]=11250000 * (10**18); //
          investorMinCap   = 0.2 * (10**18);
          investorHardCap  = 10 * (10**18);
           _rate = 0.025 * (10**8); //usd
        }else if (uint(CrowdsaleStage.PublicSale_1) == _stage) {
         stage = CrowdsaleStage.PrivateSale;
          CrowdsaleStageBalance[stage]=13500000 * (10**18); //
          investorMinCap   = 0.25 * (10**18);
          investorHardCap  = 25 * (10**18);
           _rate = 0.045 * (10**8); // usd
        }else if(uint(CrowdsaleStage.PublicSale_2) == _stage){
            stage = CrowdsaleStage.PublicSale_2;
          CrowdsaleStageBalance[stage]=11250000 * (10**18);
          investorMinCap   = 0.5 * (10**18);
          investorHardCap  = 50 * (10**18);
           _rate = 0.065 * (10**8); //0.1 eth
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
        return _contributions[stage][_participant];
    }
    function getParticipantReceivings(address _participant) public view returns (uint256){
        return _receiving[stage][_participant];
    }
    function _updateParticipantBalance(address _participant, uint256 _giving,uint256 _numOfTokens) internal{
        uint256 oldGivings = getParticipantGivings(_participant);
        uint256 oldReceivings = getParticipantReceivings(_participant);
        
        uint256 newGivings = oldGivings.add(_giving);
        uint256 newReceiving = oldReceivings.add(_numOfTokens);
        
        _contributions[stage][_participant] = newGivings;
        _receiving[stage][_participant] = newReceiving;
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
    function _preValidateParticipation(uint256 _sentValue,uint256 _numberOfTokens, address _participant) internal view {
        //Require that contract has enough tokens 
        require(_tokenContract.balanceOf(address(this)) >= _numberOfTokens,'token requested not available');
        //require that participant giving is between the caped range per stage
        require(_isIndividualCapped(_participant,  _sentValue),'request not within the cap range');
    }
    function _processParticipation(address recipient, uint256 amount) internal{
        require( _forwardFunds());
        require(_tokenContract.transfer(recipient, amount));
    }
    function r () public {
        _tokenContract.releaseTokenTransfer();
    }

    /**
     * Returns the ETHUSD latest price
     */
    function getTheETHUSDPrice(uint80 roundId) internal view returns (int) {
        (
            uint80 id, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = ETHUSD.getRoundData(roundId);
        require(timeStamp > 0, "Round not complete");
        require(block.timestamp <= timeStamp + 1 days);
        return price;
    }
    /**
     * Returns the BNBUSD latest price
     */
    function getTheBNBUSDPrice(uint80 roundId) internal view returns (int) {
        (
            uint80 id, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = BNBUSD.getRoundData(roundId);
         require(timeStamp > 0, "Round not complete");
         require(block.timestamp <= timeStamp + 1 days);
        return price;
    }
   /**
   * @dev forwards funds to the sale Walletcrowdsale.isOpen
   */
  function _forwardFunds() internal returns (bool){
    _wallet.transfer(msg.value);
    return true;
  }

    function startTime() public view returns (uint256) {
        return _startTime;
    }
    function endTime() public view returns (uint256) {
        return _endTime;
    }
    function isOpen() public view returns (bool) {
       require(block.timestamp >= _startTime && block.timestamp <= _endTime ,"Crowdsale: not opened");
       require(stage != CrowdsaleStage.Paused && stage != CrowdsaleStage.Ended,"Crowdsale: not opened");
       return true;
    }
    function hasClosed() public view returns (bool) {
        return block.timestamp > _endTime;
    }
    function _extendTime(uint256 newEndTime) public onlyOwner {
        require(!hasClosed(), "Crowdsale: close already");
        require(newEndTime > _endTime, "Crowdsale: new endtime must be after current endtime");

        emit CPE(_endTime, newEndTime);
        _endTime = newEndTime;
    }
    function getSoftCap() public view returns (uint256){
        return mulaSoftCap;
    }
    function getHardCap() public view returns (uint256){
        return mulaHardCap;
    }
    function isFinalized() public view returns (bool) {
        return _finalized;
    }
    function finalize() public onlyOwner{
        require(!_finalized, "Crowdsale: already finalized");
        require(hasClosed(), "Crowdsale: has not ended");
        uint totalSup = 100000000;

        _finalized = true;

        //Dev&Marketing
        uint devmarketTotal = (totalSup * (_DevMarketingPercentage * 100) ) /10000; 
        EffectDistributionAndLockRelease(_DevMarketing, devmarketTotal, _DevMarketing_TotalDur, _DevMarketing_ReleaseInterval, _DevMarketing_percentPerReleaseInterval,_DevMarketing_ID);

        //Founder 1
        uint founder1Total = (totalSup * (_FounderFund1Percentage * 100) ) /10000; 
        EffectDistributionAndLockRelease(_FounderFund1, founder1Total, _FounderFund1_TotalDur, _FounderFund1_ReleaseInterval, _FounderFund1_percentPerReleaseInterval,_FounderFund1_ID);

        //Founder 2
        uint founder2Total = (totalSup * (_FounderFund2Percentage * 100) ) /10000; 
        EffectDistributionAndLockRelease(_FounderFund1, founder2Total, _FounderFund2_TotalDur, _FounderFund2_ReleaseInterval, _FounderFund2_percentPerReleaseInterval,_FounderFund2_ID);

        //Listing & Liquidity
        uint listingLiquidityTotal = (totalSup * (_ListingLiquidityPercentage * 100) ) /10000; 
        EffectDistributionAndLockRelease(_ListingLiquidity, listingLiquidityTotal, _ListingLiquidity_TotalDur, _ListingLiquidity_ReleaseInterval, _ListingLiquidity_percentPerReleaseInterval,_ListingLiquidity_ID);

        //Operations & Management
        uint operationsManagementTotal = (totalSup * (_OperationsManagementPercentage * 100) ) /10000;
        EffectDistributionAndLockRelease(_OperationsManagement, operationsManagementTotal, _OperationsManagement_TotalDur, _OperationsManagement_ReleaseInterval, _OperationsManagement_percentPerReleaseInterval,_OperationsManagement_ID);

        emit COF();
    }
    function EffectDistributionAndLockRelease(address _beneficiary, uint _totalValue,uint  _totalDur, uint _releaseInterval, uint _percentPerReleaseInterval,uint identifier) internal returns (bool){

            uint intervalValue;
            uint releaseDay;
            uint totalValue = _totalValue;
            uint totalDur = _totalDur;
            uint interval = _releaseInterval; 
            uint percentPerInterval = _percentPerReleaseInterval;
            intervalValue = (totalValue * (percentPerInterval * 100) ) /10000;
            intervalValue = (totalValue * (percentPerInterval * 100) ) /10000;
            for (interval; interval <= totalDur; interval ++ ) {  //for loop example
                releaseDay = block.timestamp + interval * 1 days; //CHANGE BACK TO 30 DAYS
                _vaultContract.depositToVault(_beneficiary, intervalValue * (10 **18) , releaseDay,identifier);
            }
        return true;
    }




}