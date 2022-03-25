pragma solidity ^0.5.0;

import "./NUSToken.sol";
/** 
* @title NUSLibrary
*/

contract NUSLibrary {
  address admin;
  NUSToken NUSTokeninstance;
  mapping(address => uint256) fineList;

  constructor(NUSToken nust) public {
    NUSTokeninstance = nust;
    admin = msg.sender;
  }

  modifier isLibrarian() {
    require(msg.sender == admin, "Not authorised");
    _;
  }

  //Event 
  event fineAssigned(address student, uint256 amt);
  event fineCollected(address student, uint256 amt);
  event blacklistUpdated(address student);

   /** 
     * Assign fine to each blacklisted options
     * @param student address of student,
     * @param amt amount that librarian decides to fine student, amount calculated offchain 
     */
  function assignFine(address student, uint256 amt) public isLibrarian {
    fineList[student] += amt; // cummulative fine 
    emit fineAssigned(student, amt);
  }

  /** 
    * Add student to the blacklist
    * @param student address of student
    * blacklisted student by default gets assigned a fine of 0 until it is assigned by librarian 
    */
  function addToBlacklist(address student) public isLibrarian { 
    NUSTokeninstance.modifyBlacklist(student, true);
    fineList[student] = 0; // add student to fine list, default is zero 
    emit blacklistUpdated(student);
  }

  /** 
    * Student made to pay up his/her fines
    * Remove student from blacklist 
    * @param student address of student 
    */
  function removeFromBlacklist(address student) public isLibrarian {
    require(fineList[student] != 0, "Fine not assigned to student"); // fine must be assigned prior
    NUSTokeninstance.fine(student, fineList[student]);
    emit fineCollected(student, fineList[student]);

    NUSTokeninstance.modifyBlacklist(student, false); // remove from nustoken blacklist 
    emit blacklistUpdated(student);
  }
}