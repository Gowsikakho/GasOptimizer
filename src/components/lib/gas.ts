export type Size = 10 | 50 | 100;
export type Row = { op: string; v1: number; v2: number };

export const results: Record<Size, Row[]> = {
  10: [
    { op: "Deployment", v1: 606753, v2: 472037 },
    { op: "addMarks()", v1: 275963, v2: 74925 },
    { op: "getTotal()", v1: 49919, v2: 31921 },
    { op: "countPassed(60)", v1: 49651, v2: 30758 },
    { op: "updateMark(3,77)", v1: 31497, v2: 29494 },
  ],
  50: [
    { op: "Deployment", v1: 606753, v2: 472037 },
    { op: "addMarks()", v1: 1194728, v2: 134015 },
    { op: "getTotal()", v1: 155319, v2: 59511 },
    { op: "countPassed(60)", v1: 153269, v2: 51912 },
    { op: "updateMark(3,77)", v1: 31497, v2: 29494 },
  ],
  100: [
    { op: "Deployment", v1: 606753, v2: 472037 },
    { op: "addMarks()", v1: 2343194, v2: 224265 },
    { op: "getTotal()", v1: 287069, v2: 95461 },
    { op: "countPassed(60)", v1: 281151, v2: 79698 },
    { op: "updateMark(3,77)", v1: 31497, v2: 29494 },
  ],
};

export const totals = (rows: Row[]) => ({
  v1: rows.reduce((s, r) => s + r.v1, 0),
  v2: rows.reduce((s, r) => s + r.v2, 0),
});

export const savedPct = (v1: number, v2: number) => ((v1 - v2) / v1) * 100;

/** Fee in ETH for a gas amount at a gas price in Gwei. */
export const feeEth = (gas: number, gwei: number) => (gas * gwei) / 1e9;

export const techniques = [
  { name: "Custom errors", idea: "A 4-byte error selector replaces a long revert string — smaller bytecode, cheaper reverts." },
  { name: "Immutable owner", idea: "Owner is embedded in bytecode (3 gas) instead of a cold SLOAD (2,100 gas)." },
  { name: "calldata params", idea: "External arrays are read straight from transaction data without copying to memory." },
  { name: "Cached length + unchecked ++i", idea: "Removes one storage read and one overflow check per loop iteration." },
  { name: "uint8 storage packing", idea: "32 marks share one 32-byte slot. The single biggest saving: 2 new slots instead of 50." },
];

export const v1Code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MarksRegistryV1 {
    address public owner;
    uint256[] public marks;

    constructor() { owner = msg.sender; }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function addMarks(uint256[] memory _marks) public onlyOwner {
        for (uint256 i = 0; i < _marks.length; i++) {
            require(_marks[i] <= 100, "Mark must be 100 or less");
            marks.push(_marks[i]);
        }
    }

    function getTotal() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < marks.length; i++) {
            total = total + marks[i];
        }
        return total;
    }

    function countPassed(uint256 passMark) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < marks.length; i++) {
            if (marks[i] >= passMark) { count = count + 1; }
        }
        return count;
    }

    function updateMark(uint256 index, uint256 newMark) public onlyOwner {
        require(index < marks.length, "Index out of range");
        require(newMark <= 100, "Mark must be 100 or less");
        marks[index] = newMark;
    }
}`;

export const v2Code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MarksRegistryV2 {
    error NotOwner();
    error MarkTooHigh();
    error IndexOutOfRange();

    address public immutable owner;
    uint8[] public marks;

    constructor() { owner = msg.sender; }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function addMarks(uint256[] calldata _marks) external onlyOwner {
        uint256 len = _marks.length;
        for (uint256 i; i < len; ) {
            uint256 m = _marks[i];
            if (m > 100) revert MarkTooHigh();
            marks.push(uint8(m));
            unchecked { ++i; }
        }
    }

    function getTotal() external view returns (uint256 total) {
        uint256 len = marks.length;
        for (uint256 i; i < len; ) {
            total += marks[i];
            unchecked { ++i; }
        }
    }

    function countPassed(uint256 passMark) external view returns (uint256 count) {
        uint256 len = marks.length;
        for (uint256 i; i < len; ) {
            if (marks[i] >= passMark) { unchecked { ++count; } }
            unchecked { ++i; }
        }
    }

    function updateMark(uint256 index, uint256 newMark) external onlyOwner {
        if (index >= marks.length) revert IndexOutOfRange();
        if (newMark > 100) revert MarkTooHigh();
        marks[index] = uint8(newMark);
    }
}`;
