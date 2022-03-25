pragma solidity ^0.5.0;

import "./NUSToken.sol";
/** 
* @title NUSLibrary
*/

contract NUSLibrary {
  address admin;
  NUSToken NUSTokeninstance;
  mapping(address => bool) isPaid;
  mapping(address => uint256) fineList;

  constructor(NUSToken nust) public {
    NUSTokeninstance = nust;
    admin = msg.sender;
  }

  //Event 
  event BlacklistAppended(address[] listLate); 
  event fineAssigned(address student, uint256 amt);
  event fineCollected(address student, uint256 amt);
  event BlacklistUpdated(address student);

  function assignFine(address student, uint256 amt) public {
    fineList[student] = amt;
    emit fineAssigned(student, amt);
  }

  function addToBlacklist(address[] memory listOfLateBorrowers) public {
    uint256 length = listOfLateBorrowers.length;
    for (uint256 i = 0; i < length; i++) {
      address student = listOfLateBorrowers[i]; 
      require(NUSTokeninstance.isAddressInBlacklistedAddresses(student), "Student not found in blacklist"); // make sure student is not an existing offender 
      NUSTokeninstance.modifyBlacklist(student, true); // add student to blacklist 
      isPaid[student] = false; // student marked as not paid
    }
    emit BlacklistAppended(listOfLateBorrowers);
  }

  function removeFromBlacklist(address student) public {
    require(isPaid[student] == false, "Student has paid fine"); // student must not have paid his/her fine yet
    require(fineList[student] != 0, "Fine not assigned to student"); // fine must be assigned prior
    NUSTokeninstance.fine(student, fineList[student]);
    isPaid[student] = true; // fine paid  
    emit fineCollected(student, fineList[student]);

    NUSTokeninstance.modifyBlacklist(student, false); // remove from nustoken blacklist 
    emit BlacklistUpdated(student);
  }
}