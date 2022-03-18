pragma solidity >=0.5.0;

import "./NUSToken.sol";
/** 
* @title NUSLibrary
*/

contract NUSLibrary {
  address[] listOfLateBorrowers;
  NUSToken nusToken;
  mapping(address => bool) isPaid;

  function blacklist() public {
    uint256 length = listOfLateBorrowers.length;
    for (uint256 i = 0; i < length; i++) {
      address student = listOfLateBorrowers[i]; 
      require(nusToken.blacklistAddresses[student] != true); // make sure student is not an existing offender 
      nusToken.blacklistAddresses[student] = true; // add student to blacklist 
      isPaid[student] = false; // student marked as not paid
    } 
  }

  function payFine(address student) public {
    require(isPaid[student] == false); // student must not have paid his/her fine yet
    nusToken.blacklistAddresses[student] = false; // remove from nustoken blacklist 
    isPaid[student] = true; // fine paid  
  }
}