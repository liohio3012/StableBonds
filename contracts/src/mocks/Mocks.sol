// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../StableBondsVault.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**6);
    }
}

contract MockTokenMessenger is ITokenMessenger {
    address public burnTokenChecked;
    uint256 public amountChecked;
    uint32 public domainChecked;
    bytes32 public recipientChecked;
    uint64 public nonce = 100;

    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64) {
        amountChecked = amount;
        domainChecked = destinationDomain;
        recipientChecked = mintRecipient;
        burnTokenChecked = burnToken;
        IERC20(burnToken).transferFrom(msg.sender, address(0xdead), amount);
        return nonce++;
    }
}

contract MockStableFX is IStableFX {
    address public usdc;
    address public eurc;
    uint256 public rate = 110; // 1.10 rate: 1 EUR = 1.10 USD (with 6 decimals)

    constructor(address _usdc, address _eurc) {
        usdc = _usdc;
        eurc = _eurc;
    }

    function executeTrade(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 minBuyAmount,
        bytes calldata /* tradeData */
    ) external returns (uint256 buyAmount) {
        IERC20(sellToken).transferFrom(msg.sender, address(this), sellAmount);

        if (sellToken == eurc && buyToken == usdc) {
            buyAmount = (sellAmount * rate) / 100;
        } else if (sellToken == usdc && buyToken == eurc) {
            buyAmount = (sellAmount * 100) / rate;
        } else {
            buyAmount = sellAmount;
        }

        require(buyAmount >= minBuyAmount, "Slippage: mocked swap buyAmount too low");

        IERC20(buyToken).transfer(msg.sender, buyAmount);
        return buyAmount;
    }
}

contract MockMessageTransmitter {
    function receiveMessageWithPayload(
        address vault,
        uint32 sourceDomain,
        bytes32 sender,
        bytes calldata messageBody
    ) external {
        IMessageHandler(vault).handleReceiveMessage(sourceDomain, sender, messageBody);
    }
}

/**
 * @notice MockKeeperRegistry — simulates the Chainlink Automation ForwarderRegistry.
 *         Calls checkUpkeep off-chain (here as a state-reading call) then calls
 *         performUpkeep if upkeepNeeded == true.
 *         Used exclusively by the integration test suite.
 */
contract MockKeeperRegistry {
    bool public lastUpkeepNeeded;
    bytes public lastPerformData;

    /**
     * @notice Runs one full keeper cycle against the target vault:
     *         1. Calls checkUpkeep to detect matured bonds.
     *         2. If upkeepNeeded, calls performUpkeep with the returned performData.
     * @param vault  Address of the StableBondsVault to keep.
     * @return upkeepNeeded  Whether work was found.
     * @return performData   The raw bytes returned by checkUpkeep (for test inspection).
     */
    function runUpkeep(address vault)
        external
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // Cast to AutomationCompatibleInterface — we re-declare only the needed functions
        // to avoid a circular import. The signatures match exactly.
        (bool needed, bytes memory pData) =
            IVaultKeeper(vault).checkUpkeep(bytes(""));

        lastUpkeepNeeded = needed;
        lastPerformData  = pData;

        if (needed) {
            IVaultKeeper(vault).performUpkeep(pData);
        }

        return (needed, pData);
    }
}

/**
 * @dev Minimal interface used by MockKeeperRegistry to interact with the vault.
 */
interface IVaultKeeper {
    function checkUpkeep(bytes calldata checkData)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}
