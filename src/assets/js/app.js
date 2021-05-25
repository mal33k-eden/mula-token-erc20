const walletBtn = document.querySelector('.connectWallet');
const buyBtn = document.querySelector('#buyTokenBtn');

App = {
    account:null,
    network:null,
    networks:['0x1','0x38'],
    rate_eth:123,
    rate_bnb:456,
    rate_busd:789,
    init:()=>{
        console.log('App Initialized...');
        App.loadWeb3();
        walletBtn.addEventListener('click', () => {App.connectToMM();});
        buyBtn.addEventListener('click', () => {App.buyToken();});
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
            console.error('Please install  the latest version of MetaMask!');
        }
    },
    loadMM:(accounts)=>{
        if (accounts.length === 0) {
            console.log(accounts);
            // MetaMask is locked or the user has not connected any accounts
            //$('#walletUnlocked').show();
            //$('#walletUnlocked').html('Looks like you have not unlocked your metamask wallet. check your wallet & try again');
            $(".connectWallet").show();
            //$(".buy_channels").removeClass('d-flex');
            //$(".buy_channels").css('display','none');
        } else if (accounts[0] !== App.account) {
            App.account = accounts[0];
            App.getNetwork();
            $(".connectWallet").hide();
            $('#accountAddress').html("#: " + App.account);
            // Do any other work!
            console.error(accounts);
        }          
      },
    requestMM:()=>{
        ethereum.request({ method: 'eth_accounts' })
            .then(App.loadMM)
            .catch((err) => {
            // Some unexpected error.
            // For backwards compatibility reasons, if no accounts are available,
            // eth_accounts will return an empty array.
            console.error(err);
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
                // EIP-1193 userRejectedRequest error
                // If this happens, the user rejected the connection request.
                console.log('You have rejected connectivity');
              } else {
                console.error(err);
              }
        });
    },
    getNetwork: async  ()=>{
        const chainId = await ethereum.request({ method: 'eth_chainId' }).then((x)=>{
           App.network = x;
        });  
        return App.network;
    },
    getSliderValue:async (value)=>{
        if(!App.validateForm()){
            console.log('error');
            $('#bt-slider').val(0);
            $('#bt-slider-label').html(0);
        }else{
            $('#bt-slider-label').html(value + "ETH = 1000 MULA");
        }
    },
    buyToken:()=>{
        const bal = App.web3.eth.getBalance(App.account).then((bal)=>{
            console.log(bal);
        });
        
        //check the currency is selected
        //check the currency corresponds to the wallet network selected 
        // route the transaction
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
    }

};

$(()=>{
    App.init();
    document.body.oncontextmenu = function() {}
});