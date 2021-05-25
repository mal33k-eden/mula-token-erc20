const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const MulaToken = artifacts.require('MulaToken');
const MulaTokenCrowdSale = artifacts.require('MulaTokenCrowdSale');

contract('MulaTokenCrowdSale', (accounts)=>{
    const name = 'Mula Token';
    const symbol = 'MULA';
    const totalSupply = 100000000;
    const crowdsaleSupply = new BN(20000000);
    var rate = 1000000000000000; // in wei == 0.001 eth
    var wallet = accounts[3];

    beforeEach(async function () {
        this.token = await MulaToken.new();
        this.crowdsale = await MulaTokenCrowdSale.new(rate,wallet,this.token.address);
        this.token.transfer(this.crowdsale.address,crowdsaleSupply);
    });

    describe('TOKEN migrates with the right details', ()=>{
        
        it('has a name', async function () {
            expect(await this.token.name()).to.equal(name);
          });
        
          it('has a symbol', async function () {
            expect(await this.token.symbol()).to.equal(symbol);
          });
        
          it('has 18 decimals', async function () {
            expect(await this.token.decimals()).to.be.bignumber.equal('18');
          });
    });
    describe('Crowdsale migrates with the right details', ()=>{
        
        it('has the rates', async function () {
          //zero because the initial state for teh crowdsale is paused. which has the rat as zero
            expect(await this.crowdsale._rate()).to.be.bignumber.equal(new BN(0));
          });
        
          //will fails cause _wallet is a private variable 
        //   it('has the wallet', async function () {
        //     expect(await this.crowdsale._wallet()).to.equal(wallet);
        //   });
        
          it('has the crowdsale tokens', async function () {
            expect(await this.token.balanceOf(this.crowdsale.address)).to.be.bignumber.equal(crowdsaleSupply);
          });
    });

    describe('Admin can update crowdsale stage', ()=>{
        it('get default  balance', async function () {
             expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("0");
        });
        it('updates the pre-sale 1  balance', async function () {
            await this.crowdsale.updateStage(0);
             expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("10000000");
        });
        it('updates the pre-sale 2  balance', async function () {
            await this.crowdsale.updateStage(1);
             expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("20000000");
        });
        it('updates the pre-sale 3  balance', async function () {
            await this.crowdsale.updateStage(2);
             expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("30000000");
        });
        it('updates the ico balance', async function () {
            await this.crowdsale.updateStage(3);
             expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("40000000");
        });
        it('updates the paused balance', async function () {
            await this.crowdsale.updateStage(4);
             expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("0");
        });
        // it('allows only admin to update stage', async function () {
        //      expect(await this.crowdsale.updateStage(1,{from:accounts[0]}));
        // });    
    });
    describe('Public can participate  in PRE_SALE 1', async function(){
      //change the application stage to presale one 
      it('updates the pre-sale 1  balance', async function () {
         await this.crowdsale.updateStage(0);
         expect(await this.crowdsale.getStageBalance()).to.be.bignumber.equal("10000000");
      });
      it('updates the pre-sale 1  rate', async function () {
        await this.crowdsale.updateStage(0);
        expect(await this.crowdsale._rate()).to.be.bignumber.equal("100000000000000");
     });
      it('allows participants to participate', async function () {
        await this.crowdsale.updateStage(0);
        await this.crowdsale.participate(1000,{from:accounts[7], value:100000000000000000 });
        var result = await this.crowdsale._tokensSold();
        expect(result).to.be.bignumber.equal("1000");
        console.log(result.toString());

      });

    });

    
    

});