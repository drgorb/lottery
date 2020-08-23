pragma solidity ^0.6.2;

contract Lottery {

    struct Bet {
        address sender;
        uint256 start;
        uint256 end;
    }

    Bet[] public bets;

    bool public closed;
    uint256 maxBets = 0;
    uint256 public winningNumber;

    constructor(uint256 max) public {
        maxBets = max;
    }

    function cashOut() public {
        require(msg.sender == winner(), "only the winner can cash out");
        msg.sender.transfer(address(this).balance);
    }

    function winner() public view returns (address) {
        for (uint8 i = 0; i < bets.length; i++) {
            Bet memory bet = bets[i];
            if (winningNumber >= bet.start && winningNumber < bet.end) {
                return bet.sender;
            }
        }
        return address(0x0);
    }

    receive() external payable {
        require(!closed, "once the lottery closes, no more bets are allowed");
        require(msg.value > 0, "you have to pay in order to bet");

        uint256 balance = address(this).balance;

        uint256 betEnd = balance;
        if(balance > maxBets) {
            msg.sender.transfer(balance - maxBets);
            betEnd = maxBets;
        }
        bets.push(Bet(msg.sender, balance - msg.value, betEnd));

        if(balance >= maxBets) {
            closed = true;
            winningNumber = uint(keccak256(abi.encode(block.timestamp, blockhash(block.number)
            , blockhash(block.number - 1)
            , blockhash(block.number - 2)
            , blockhash(block.number - 3)
            , blockhash(block.number - 4)))) % maxBets;
        }
    }
}
