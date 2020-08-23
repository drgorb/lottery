var LotteryFactory = artifacts.require('LotteryFactory')
var Lottery = artifacts.require('Lottery')
const BigNumber = require('bignumber.js')
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('LotteryFactory', function (accounts) {
    const toBN = (num) => new BigNumber(num)

    let lotteryFactory = undefined
    let lottery = undefined
    const maxBet = "49500000000000000000"
    const taxman = web3.eth.accounts.create()

    it("creates a factory for lottery contracts", async () => {
        lotteryFactory = await LotteryFactory.new()
    })

    it("allows to create lottery contracts that yield the factory address as creator", async () => {
        const tx = await lotteryFactory.newLottery(maxBet, taxman.address)
        let lotteryAddress
        truffleAssert.eventEmitted(tx, 'NewLottery', (ev) => {
            lotteryAddress = ev.lotteryAddress
            return lotteryAddress != "0x00000000000000000000000000000000000000"
        });
        lottery = await Lottery.at(lotteryAddress)
        assert.equal(await lottery.creator(), lotteryFactory.address)
        assert.equal((await lottery.maxBets()).toString(), maxBet)
        assert.equal(await lottery.taxman(), taxman.address)
    })

})
