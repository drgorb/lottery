var Lottery = artifacts.require('Lottery')
const BigNumber = require('bignumber.js')

contract('Lottery', function (accounts) {
  const toBN = (num) => new BigNumber(num)

  let lottery = undefined
  const maxBet = "49500000000000000000"

  before(async () => {
    lottery = await Lottery.new(maxBet)
  })

  it("has no winner and no winning number", async () => {
    assert.equal(true, toBN(await lottery.winningNumber()).isEqualTo(0))
    assert.equal("0x0000000000000000000000000000000000000000", await lottery.winner())
  })

  it("allows all players to place a bet", async () => {
    const betValue = toBN("1000000000000000000")
    const bal49 = toBN(await web3.eth.getBalance(accounts[49]))
    let tx
    for(let i = 0; i < 50; i++) {
      tx = await web3.eth.sendTransaction({from: accounts[i], to: lottery.address, value: betValue, gas: "1000000"})
      const bet = await lottery.bets(i)
      assert.equal(bet[0], accounts[i])
      assert.equal(bet[1].toString(10), betValue.times(i))
      if(i < 49) {
        assert.equal(betValue.times(i + 1).toString(10), bet[2].toString(10))
      } else {
        assert.equal(bet[2].toString(10), maxBet)
      }
    }
    assert.equal(bal49.minus(await web3.eth.getBalance(accounts[49])).toString(10), "502843560000000000")
  })

  it("has closed the lottery", async () => {
    assert.equal(await lottery.closed(), true)
  })

  it("has a winner and a winning number", async () => {
    const winningNumber = await lottery.winningNumber()
    assert.equal(true, toBN(winningNumber).isGreaterThan(0))
    const winner = await lottery.winner()
    assert.equal(true, winner != "0x0000000000000000000000000000000000000000")

    for(let i = 0; i < 50; i++) {
      const bet = await lottery.bets(i)

    }

  })

})
