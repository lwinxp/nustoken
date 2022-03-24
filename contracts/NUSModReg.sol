pragma solidity >=0.5.0;

import "./ERC20.sol";
import "./NUSToken.sol";

/**
 * @title NUSModReg
 */

/**
 * Flow:
 *  - Start and end bidding window off chain
 *  - Student active, take in module code, rank module, read balance
 *  - Struct to store address, module code, rank, balance
 *  - Whenever someone gets a mod, allocation result is some kind of print log, balance of address, to read by frontend
 *  - Not stored on chain
 *  - Modifier to check if they are in the blacklist for not paying fines/returns books (private)
 */
contract NUSModReg {
    NUSToken NUSTokeninstance;

    uint256 maxModuleRegistered = 10;
    address admin;
    bytes32[] private allModules;
    mapping(bytes32 => uint256) moduleToQuota;
    mapping(bytes32 => address[]) moduleToAllocation;
    address[] private allStudents;
    mapping(address => bytes32[]) studentToModules;
    mapping(address => bytes32[]) studentToAllocation;

    constructor(NUSToken NUSTokeninstanceAddress) public {
        NUSTokeninstance = NUSTokeninstanceAddress;
        admin = msg.sender;
    }

    // Event
    event BiddingStarted(bytes32[] moduleCodes, uint256[] moduleQuota); // event of starting the bidding
    event BiddingEnded(); // event of ending the bidding
    event ModuleAllocations(bytes32 moduleCode, address[] students); // event of allocation done for a module
    event StudentAllocations(address student, bytes32[] moduleCodes); // event of allocation done for a student

    // moduleCodes: ["cs1010", "ma1101s"] in string, corresponding bytes32 below
    // moduleCodes: ["0x6373313031300000000000000000000000000000000000000000000000000000","0x6d61313130317300000000000000000000000000000000000000000000000000"]
    // moduleQuota: [1,2]
    function registerModules(
        bytes32[] memory moduleCodes,
        uint256[] memory moduleQuota
    ) public {
        require(msg.sender == admin, "Only Admin can register Modules");
        uint256 length = moduleCodes.length;
        require(length == moduleQuota.length, "Input lengths dont match");
        for (uint256 i = 0; i < length; i++) {
            // Positive quota
            require(moduleQuota[i] > 0, "You can have negative or 0 qouta for modules");
            // No duplicate code
            require(moduleToQuota[moduleCodes[i]] == 0, "Module Code has already been set");
            moduleToQuota[moduleCodes[i]] = moduleQuota[i];
        }
        for (uint256 i = 0; i < length; i++) {
            allModules.push(moduleCodes[i]);
        }

        emit BiddingStarted(moduleCodes, moduleQuota);
    }

    function bid(bytes32 moduleCode) public {
        // Module must be present
        require(moduleToQuota[moduleCode] != 0, "Incorrect Byte32 code for module");
        // Max number of modules allowed to bid.
        require((studentToModules[msg.sender]).length <= maxModuleRegistered,"You are bidding for too many mods");
        // Check if student exists
        if ((studentToModules[msg.sender]).length == 0) {
            allStudents.push(msg.sender);
        }
        for (uint256 i = 0; i < (studentToModules[msg.sender]).length; i++) {
            // Check if moduleCode already exists.
            if (studentToModules[msg.sender][i] == moduleCode) {
                return;
            }
        }
        (studentToModules[msg.sender]).push(moduleCode);
    }

    function allocate() public {
        require(msg.sender == admin);

        emit BiddingEnded();

        // moduleToAllocation might contain more modules than the quota
        for (uint256 i = 0; i < allStudents.length; i++) {
            address studentAdd = allStudents[i];
            for (
                uint256 j = 0;
                j < (studentToModules[studentAdd]).length;
                j++
            ) {
                bytes32 moduleCode = studentToModules[studentAdd][j];
                moduleToAllocation[moduleCode].push(studentAdd);
            }
        }
        // need to sort and trim
        for (uint256 i = 0; i < allModules.length; i++) {
            bytes32 moduleCode = allModules[i];
            if (
                (moduleToAllocation[moduleCode]).length <=
                moduleToQuota[moduleCode]
            ) {
                // within quota
                continue;
            }
            // Insertion sort
            for (
                uint256 j = 1;
                j < (moduleToAllocation[moduleCode]).length;
                j++
            ) {
                address currentStudent = moduleToAllocation[moduleCode][j];
                uint256 k = j - 1;
                while (
                    (int256(k) >= 0) &&
                    (NUSTokeninstance.balanceOf(
                        moduleToAllocation[moduleCode][k]
                    ) < NUSTokeninstance.balanceOf(currentStudent))
                ) {
                    moduleToAllocation[moduleCode][k + 1] = moduleToAllocation[
                        moduleCode
                    ][k];
                    k--;
                }
                moduleToAllocation[moduleCode][k + 1] = currentStudent;
            }
            // Trim the list
            for (
                uint256 j = moduleToQuota[moduleCode];
                j < (moduleToAllocation[moduleCode]).length;
                j++
            ) {
                (moduleToAllocation[moduleCode]).pop();
            }
            emit ModuleAllocations(moduleCode, moduleToAllocation[moduleCode]);
        }
        // Populate studentToAllocation
        for (uint256 i = 0; i < allModules.length; i++) {
            bytes32 moduleCode = allModules[i];
            for (
                uint256 j = 0;
                j < (moduleToAllocation[moduleCode]).length;
                j++
            ) {
                address studentAdd = moduleToAllocation[moduleCode][j];
                studentToAllocation[studentAdd].push(moduleCode);
            }
        }
        for (uint256 i = 0; i < allStudents.length; i++) {
            address studentAdd = allStudents[i];
            emit StudentAllocations(
                studentAdd,
                studentToAllocation[studentAdd]
            );
        }
    }

    // Test function.
    function getMyBidModules() public view returns (bytes32[] memory) {
        return studentToModules[msg.sender];
    }

    function getModuleAllocation(bytes32 moduleCode)
        public
        view
        returns (address[] memory)
    {
        return moduleToAllocation[moduleCode];
    }

    function getMyAllocation() public view returns (bytes32[] memory) {
        return studentToAllocation[msg.sender];
    }

    function getMyBalance() public view returns (uint256) {
        return NUSTokeninstance.balanceOf(msg.sender);
    }

    function getModuleQuota(bytes32 mod) public view returns (uint256) {
        return moduleToQuota[mod];
    }

    // TODO:Modifier to check if they are in the blacklist for not paying fines/returns books (private)
}
