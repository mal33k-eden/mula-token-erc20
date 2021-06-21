const walletBtn = document.querySelector('.connectWallet');
const buyBtn = document.querySelector('#buyTokenBtn');
const currRadio = $("input[type='radio'][name='currency']");
const DateTime = luxon.DateTime;

App = {
    account:null,
    network:null,
    networks:['0x4','0x61'], //ropsten 0x3 //rinkeby 0x4
    networkRates:{"ETH":0,"BNB":0,"BUSD":0},
    contractAddress:{'token':'0x82eF40C0Cf0F31BbA8e51af6F3293fCb0b66461c',
                    'crowdsale':'0x9b54a9aF40447eC6F1d611bC9681926e733206Ab',
                    'token-bsc':'0x00','crowdsale-bsc':'0x0'},
    contracts:{},
    aggregator:{ "provider":new Web3("https://rinkeby.infura.io/v3/f67b5c76814745f5ba04d5bb8d37a9f1"),
                  "abi": [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"version","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}],
                  "ETHUSD_Aggregator" : "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e", //0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
                  "BNBUSD_Aggregator" : "0xcf0f51ca2cDAecb464eeE4227f5295F2384F84ED" //0x14e613AC84a31f709eadbdF89C6CC390fDc9540A
    },
    init:()=>{
        console.log('App Initialized...');
        App.loadWeb3();
        walletBtn.addEventListener('click', () => {App.connectToMM();});
        buyBtn.addEventListener('click', () => {App.buyToken();});
        currRadio.on('click', () => {
            App.loadRates();
        });       
        //App.tkAmount = document.querySelector('#bt-slider');
    },
    loadWeb3: async ()=>{
        const provider = await detectEthereumProvider();
        if (provider) {
            App.web3 = new Web3(window.ethereum);
            ethereum.on('accountsChanged', App.loadMM);
            ethereum.on('chainChanged',(_chainId) => window.location.reload());
            App.requestMM();
            
        } else {
            notification('Please install  the latest version of MetaMask!','error');
        }
        return App.loadContracts();
    },
    loadMM:(accounts)=>{
        console.log(accounts);
        if (accounts.length === 0) {
            console.log(accounts);
            // MetaMask is locked or the user has not connected any accounts
            //notification('Looks like you have not unlocked your metamask wallet. check your wallet & try again','error');
            $(".connect-it").show();
            $(".buy-it").hide();
            $('#accountAddress').hide();
        } else if (accounts[0] !== App.account) {
            App.account = accounts[0];
            App.getNetwork();
            $(".connect-it").hide();
            $(".buy-it").show();
            $('#accountAddress').html("#: " + App.account);
            App.loadBalance();
            notification('Wallet connected','success');
        }          
    },
    loadBalance:()=>{
        
        const bal = App.web3.eth.getBalance(App.account).then((bal)=>{
        const sym = App.symbol;
        if(App.networkRates[sym] != undefined ){
            console.log(App.networkRates[sym]); 
            $('#balance').html(App.web3.utils.fromWei(bal) + " "+ sym);
        }else{
            $('#balance').html('0.00');
        }
        //console.log(App.networkRates[sym]);
        });
    },
    loadContracts:()=>{
        //load Ethereum contract 
        App.contracts.MulaTokenETH = new App.web3.eth.Contract(tk,App.contractAddress['token']);
        App.contracts.MulaSaleETH = new App.web3.eth.Contract(cds,App.contractAddress['crowdsale']);
        //load BSC contract
        App.loadTokensSold();
        App.getSaleDuration();
        App.renderValues();
        return App.loadRates();
    },
    loadRates: async ()=>{
        //get eth rate
        const cs = App.contracts.MulaSaleETH;
        let radio = $("input[name='currency']:checked").val();
        $('#currency_rate').empty();
        cs.methods._rate().call().then((rate)=>{
            let r = rate;
            console.log(r)
            const ethPriceFeed = new App.aggregator.provider.eth.Contract(App.aggregator.abi, App.aggregator.ETHUSD_Aggregator);
               ethPriceFeed.methods.latestRoundData().call().then((roundData) => {
               
                let ethP = roundData[1];
                let ethR = roundData[0];
                console.log(roundData)
                console.log(ethR)
                 
                App.networkRates['ETH'] = ethP;
                App.networkRates['ETH_RoundID'] = ethR;
            });
            const bnbPriceFeed = new App.aggregator.provider.eth.Contract(App.aggregator.abi, App.aggregator.BNBUSD_Aggregator);
            bnbPriceFeed.methods.latestRoundData().call().then((roundData) => {
                let bnbP = roundData[1]/10**8;
                let bnbR = roundData[0];
                 
                App.networkRates['BNB'] = bnbP;
                App.networkRates['BNB_RoundID'] = bnbR;         
            });

            App.networkRates['BUSD'] = r;
            App.rate = r;
            
            (r  > 0  || r != undefined ) ? $('#rate').html('$ '+ r/10**8 + ' = 1 MULA') : $('#rate').html('Connecting...')  ;
            
        });
        App.rateChecker = setInterval(App.loadCurrRate,1000)
    },
    loadTokensSold:()=>{
        // //get eth sold
        // const cs = App.contracts.MulaSaleETH;
        // cs.methods._tokensSold().call().then((r)=>{
        //     $('.tokens-sold').html(r / 10**18)
        // });
    },
    loadCurrRate: function(){
        if(App.symbol !== undefined) {
            clearInterval(App.rateChecker);
            $('#currency_rate').html('1 ' + App.symbol +' = ' +App.networkRates[App.symbol]/10**8 )
            
            return;
          }
          $('#currency_rate').html('Connecting... ') ;
    },
    requestMM:()=>{
        ethereum.request({ method: 'eth_accounts' })
            .then(App.loadMM)
            .catch((err) => {
            // Some unexpected error.
            // For backwards compatibility reasons, if no accounts are available,
            // eth_accounts will return an empty array.
            notification(err,'error');
            
            $(".connectWallet").show();
        });
    },
    connectToMM:async ()=>{
        await ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(()=>{
            window.location.reload();
        })
        .catch((err) => {
            if (err.code === 4001) {
                notification('You have rejected connectivity','error');
              } else {
                console.error(err);
              }
        });
    },
    getSaleDuration :()=>{
        
    },
    setCountDown:(endTime)=>{
        $('.tk_countdown_time').each(function() {
            //var endTime = $(this).data('time');
            $(this).countdown(endTime, function(tm) {
                $(this).html(tm.strftime('<span class="counter_box"><span class="tk_counter days">%D </span><span class="tk_text">Days</span></span><span class="counter_box"><span class="tk_counter hours">%H</span><span class="tk_text">Hours</span></span><span class="counter_box"><span class="tk_counter minutes">%M</span><span class="tk_text">Minutes</span></span><span class="counter_box"><span class="tk_counter seconds">%S</span><span class="tk_text">Seconds</span></span>'));
            });
        });
    },
    getNetwork: async  ()=>{
        
        const curr = $("input[name='currency']:checked").val();
        const chainId = await ethereum.request({ method: 'eth_chainId' }).then((x)=>{
           App.network = x;
           if(App.network == App.networks[0]){
               App.symbol = 'ETH';
           }
           if(App.network == App.networks[1]){  
            if(curr == 'BUSD'){
                App.symbol = 'BUSD';
            }else{
                App.symbol = 'BNB';
            }
           }
        });  
        return App.network;
    },
    getSliderValue:async (value)=>{
        if(!App.validateForm()){
            console.log('error');
            $('#bt-slider').val(0);
            $('#bt-slider-label').html(0);
        }else{
            console.log(((App.rate /App.networkRates[App.symbol]).toFixed(8)).toString())
            console.log(App.networkRates['ETH_RoundID']);
            let total =  App.web3.utils.toWei(value) / App.web3.utils.toWei(((App.rate /App.networkRates[App.symbol]).toFixed(8)).toString());
            total = total.toString().split(".")[0]; ///before 
            $('#bt-slider-label').html(value + "ETH = "+total.toLocaleString(0)+" MULA");
            console.log(total);
        }
    },
    buyToken: async ()=>{
        const cs = App.contracts.MulaSaleETH;
        let _ethSpending = $('#bt-slider').val(); //in eth 
        let _weiSpending = App.web3.utils.toWei(_ethSpending); //in wei 
        // let _rate = (App.rate /App.networkRates[App.symbol]).toFixed(8).toString();
        // let _weiRate = App.web3.utils.toWei(_rate);
        let _tokenExpected =_weiSpending / App.web3.utils.toWei(((App.rate /App.networkRates[App.symbol]).toFixed(8)).toString());
        console.log(_tokenExpected);
        console.log(App.networkRates['ETH_RoundID']);
        const transactionParameters = {
            to: cs._address,
            from: App.account,
            data:cs.methods.participatEth(App.networkRates['ETH_RoundID']).encodeABI(),
            value:App.web3.utils.fromDecimal(App.web3.utils.toBN(_weiSpending))
            //chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
        };
          const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
          }).then(res => {
              console.log(res);
                $('#trxTokens').html('Number of Tokens: ' + _tokenExpected + ' MULA');
                $('#trxAddress').html('Your Address: ' + App.account);
                $('#trxNetwork').html('Your Network: ' + App.symbol);
                $('#transactionHash').html('TrxHash: ' + res);
                notification("You have successfully bought your token!", 'success');
                var etherScan = "https://rinkeby.etherscan.io/tx/"+res;
                $('.verify-trxhash').attr('href', etherScan);
                $('#trx-success-popup').modal('show');
                //$('.trx-success-popup').magnificPopup('open');
          }).catch(err => {
                console.log("err",err)
          });
    },
    renderValues:()=>{
        //get tokens sold
        const cs = App.contracts.MulaSaleETH;
        cs.methods._tokensSold().call().then((r)=>{
            $('.tokens-sold').html('M ' + (r / 10**18).toLocaleString(0))
            App.tokenSold= r / 10**18;
        });
        //get sale duration
        cs.methods.startTime().call().then((r)=>{
            var s = DateTime.fromSeconds(parseInt(r));
            $('#saleStart').html(s.toLocaleString(DateTime.DATE_MED,{locale: 'en-gb' }));
        });
        cs.methods.endTime().call().then((r)=>{
            var e = DateTime.fromSeconds(parseInt(r));
            $('#saleEnd').html(e.toLocaleString(DateTime.DATE_MED,{locale: 'en-gb' }));
            var countdown = e.toFormat("y/MM/dd hh:mm:ss");
            App.setCountDown(countdown);
        });
        //get hard cap & soft cap 
        cs.methods.getHardCap().call().then((r)=>{
            $('.hard_cap').html('M ' + parseInt(r).toLocaleString(0));
        });
        cs.methods.getSoftCap().call().then((r)=>{
            $('.soft_cap').html('M ' + parseInt(r).toLocaleString(0));
            var diff = parseInt(r) - App.tokenSold;
            var percentToCap = (App.tokenSold/r) * 100;
            $(".percentToCapl").css("left",percentToCap +"%");
            $(".percentToCapw").css("width",percentToCap +"%");
            console.log(r)
            $('.percentToCap').html(percentToCap + '%');
        });
    },
    closePopup: ()=>{
        $('#trx-success-popup').modal('close');
    },
    validateNetwork:(currency)=>{
        if(currency == 'ETH'){
            if(App.network == App.networks[0]){
                return true;
            }
        }
        if(currency == 'BNB'){
            if(App.network == App.networks[1]){
                return true;
            }
        }
        if(currency == 'BUSD'){
            if(App.network == App.networks[1]){
                return true;
            }
        }
        return false;
    },
    validateForm: ()=>{
        const curr = $("input[name='currency']:checked").val();
        if( curr === undefined){
            notification('Kindly select the currency you will like to pay with.','error');
            return false;
        }
        
        if(!App.validateNetwork(curr)){
            notification('Kindly make sure your wallet network corresponds to your selected currency.','error');
            return false;
        }
        return true;
    },
    updatePrice:()=>{
        let v = $("input[name='currency']:checked").val();
    }   

};

$(()=>{
    App.init();
    document.body.oncontextmenu = function() {}
});