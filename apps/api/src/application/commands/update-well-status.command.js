'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.UpdateWellStatusCommand = void 0;
var UpdateWellStatusCommand = (function () {
  function UpdateWellStatusCommand(wellId, newStatus, updatedBy, reason) {
    this.wellId = wellId;
    this.newStatus = newStatus;
    this.updatedBy = updatedBy;
    this.reason = reason;
  }
  return UpdateWellStatusCommand;
})();
exports.UpdateWellStatusCommand = UpdateWellStatusCommand;
