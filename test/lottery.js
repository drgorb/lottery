var Lottery = artifacts.require('Lottery')
const BigNumber = require('bignumber.js')

contract('Lottery', function (accounts) {
    const toBN = (num) => new BigNumber(num)

    let lottery = undefined
    const maxBet = "49500000000000000000"
    const betValue = toBN("1000000000000000000")
    const taxman = web3.eth.accounts.create()

    async function getGasCost(call) {
        const tx = await call
        const gp = await web3.eth.getGasPrice()
        return toBN(gp).times(tx.gasUsed || tx.receipt.gasUsed)
    }

    before(async () => {
        lottery = await Lottery.new(maxBet, taxman.address)
    })

    it("has address 0 as its creator", async () => {
        assert.equal(await lottery.creator(), accounts[0])
    })

    it("has no winner and no winning number", async () => {
        assert.equal(true, toBN(await lottery.winningNumber()).isEqualTo(0))
        assert.equal("0x0000000000000000000000000000000000000000", await lottery.winner())
    })

    it("allows all 50 players to place a bet", async () => {
        const bal49 = toBN(await web3.eth.getBalance(accounts[49]))
        for (let i = 0; i < 50; i++) {
            const gas = await getGasCost(web3.eth.sendTransaction({from: accounts[i], to: lottery.address, value: betValue, gas: "1000000"}))
            const bet = await lottery.bets(i)
            assert.equal(bet[0], accounts[i])
            assert.equal(bet[1].toString(10), betValue.times(i))
            if (i < 49) {
                assert.equal(betValue.times(i + 1).toString(10), bet[2].toString(10))
            } else {
                assert.equal(bet[2].toString(10), maxBet)
                const balance = await web3.eth.getBalance(accounts[49])
                assert.equal(bal49.minus(balance).minus(gas).toString(10), "500000000000000000")
            }
        }
    })

    it("has closed the lottery once all the bets are in", async () => {
        assert.equal(await lottery.closed(), true)
    })

    it("has a winner and a winning number", async () => {
        const winningNumber = await lottery.winningNumber()
        assert.equal(true, toBN(winningNumber).isGreaterThan(0))
        const winner = await lottery.winner()
        const winningAccount = accounts.find(account => account == winner)
        assert.equal(winningAccount, winner)

        for (let i = 0; i < 50; i++) {
            const bet = await lottery.bets(i)
            assert.equal(bet[0], accounts[i])
            assert.equal(bet[1].toString(10), betValue.times(i))
            if (i < 49) {
                assert.equal(betValue.times(i + 1).toString(10), bet[2].toString(10))
            } else {
                assert.equal(bet[2].toString(10), maxBet)
            }
        }

    })

    it("throws when someone else than the winner tries to cash out", async () => {
        const winner = await lottery.winner()
        const notWinner = accounts.find(account => account != winner)
        try {
            await lottery.cashOut({from: notWinner})
            assert.fail("an exception should be thrown")
        } catch (e) {
            assert.equal(e.message, "Returned error: VM Exception while processing transaction: revert only the winner can cash out -- Reason given: only the winner can cash out.")
        }
    })

    it("pays the 99% of the jackpot to the winner when they cash out", async () => {
        const winner = await lottery.winner()
        const balance = toBN(await web3.eth.getBalance(winner))
        const gasCost = await getGasCost(lottery.cashOut({from: winner}))
        const newBalance = await web3.eth.getBalance(winner)
        assert.equal(balance.plus(toBN(maxBet).times(0.99)).minus(gasCost).toString(), newBalance.toString())
    })

    it("pays the 1% of the jackpot to the taxman upon cash out", async () => {
        assert.equal(toBN(await web3.eth.getBalance(taxman.address)).toString(), toBN(maxBet).times(0.01).toString())
    })
})
