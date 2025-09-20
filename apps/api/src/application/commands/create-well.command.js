'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CreateWellCommand = void 0;
var CreateWellCommand = (function () {
  function CreateWellCommand(
    apiNumber,
    name,
    operatorId,
    wellType,
    location,
    leaseId,
    spudDate,
    totalDepth,
    createdBy,
  ) {
    this.apiNumber = apiNumber;
    this.name = name;
    this.operatorId = operatorId;
    this.wellType = wellType;
    this.location = location;
    this.leaseId = leaseId;
    this.spudDate = spudDate;
    this.totalDepth = totalDepth;
    this.createdBy = createdBy;
  }
  return CreateWellCommand;
})();
exports.CreateWellCommand = CreateWellCommand;
