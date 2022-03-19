pragma solidity >=0.5.0;

import "./NUSToken.sol";
/** 
* @title NUSLibrary
*/

contract NUSLibrary {
  address admin;
  NUSToken nusToken;
  mapping(address => bool) isPaid;

  constructor(NUSToken nust) public {
    nusToken = nust;
  }

  modifier isContractOwner() {
        require(msg.sender == admin, "Not owner of contract");
  }

  function addBlacklist(address[] listOfLateBorrowers) public isContractOwner {
    uint256 length = listOfLateBorrowers.length;
    for (uint256 i = 0; i < length; i++) {
      address student = listOfLateBorrowers[i]; 
      require(nusToken.blacklistAddresses[student] != true); // make sure student is not an existing offender 
      nusToken.blacklistAddresses[student] = true; // add student to blacklist 
      isPaid[student] = false; // student marked as not paid
    }
  }

  function removeBlacklist(address student) public isContractOwner {
    require(isPaid[student] == false); // student must not have paid his/her fine yet
    nusToken.blacklistAddresses[student] = false; // remove from nustoken blacklist 
    isPaid[student] = true; // fine paid  

    // fine tokens? or off chain pay for fine? 
  }
}