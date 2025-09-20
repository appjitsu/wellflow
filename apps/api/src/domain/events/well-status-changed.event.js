'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WellStatusChangedEvent = void 0;
var WellStatusChangedEvent = (function () {
  function WellStatusChangedEvent(
    wellId,
    apiNumber,
    previousStatus,
    newStatus,
    updatedBy,
    metadata,
  ) {
    this.wellId = wellId;
    this.apiNumber = apiNumber;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
    this.updatedBy = updatedBy;
    this.metadata = metadata;
    this.eventType = 'WellStatusChanged';
    this.occurredAt = new Date();
  }
  WellStatusChangedEvent.prototype.toString = function () {
    return 'Well '
      .concat(this.apiNumber, ' status changed from ')
      .concat(this.previousStatus, ' to ')
      .concat(this.newStatus, ' by ')
      .concat(this.updatedBy);
  };
  return WellStatusChangedEvent;
})();
exports.WellStatusChangedEvent = WellStatusChangedEvent;
