'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.LeaseStatus =
  exports.ProductionStatus =
  exports.WellType =
  exports.WellStatus =
    void 0;
var WellStatus;
(function (WellStatus) {
  WellStatus['PLANNED'] = 'PLANNED';
  WellStatus['PERMITTED'] = 'PERMITTED';
  WellStatus['DRILLING'] = 'DRILLING';
  WellStatus['COMPLETED'] = 'COMPLETED';
  WellStatus['PRODUCING'] = 'PRODUCING';
  WellStatus['SHUT_IN'] = 'SHUT_IN';
  WellStatus['TEMPORARILY_ABANDONED'] = 'TEMPORARILY_ABANDONED';
  WellStatus['PERMANENTLY_ABANDONED'] = 'PERMANENTLY_ABANDONED';
  WellStatus['PLUGGED'] = 'PLUGGED';
  WellStatus['UNKNOWN'] = 'UNKNOWN';
})(WellStatus || (exports.WellStatus = WellStatus = {}));
var WellType;
(function (WellType) {
  WellType['OIL'] = 'OIL';
  WellType['GAS'] = 'GAS';
  WellType['OIL_AND_GAS'] = 'OIL_AND_GAS';
  WellType['INJECTION'] = 'INJECTION';
  WellType['DISPOSAL'] = 'DISPOSAL';
  WellType['WATER'] = 'WATER';
  WellType['OTHER'] = 'OTHER';
})(WellType || (exports.WellType = WellType = {}));
var ProductionStatus;
(function (ProductionStatus) {
  ProductionStatus['ACTIVE'] = 'ACTIVE';
  ProductionStatus['INACTIVE'] = 'INACTIVE';
  ProductionStatus['SHUT_IN'] = 'SHUT_IN';
  ProductionStatus['ABANDONED'] = 'ABANDONED';
})(ProductionStatus || (exports.ProductionStatus = ProductionStatus = {}));
var LeaseStatus;
(function (LeaseStatus) {
  LeaseStatus['ACTIVE'] = 'ACTIVE';
  LeaseStatus['EXPIRED'] = 'EXPIRED';
  LeaseStatus['TERMINATED'] = 'TERMINATED';
  LeaseStatus['SUSPENDED'] = 'SUSPENDED';
})(LeaseStatus || (exports.LeaseStatus = LeaseStatus = {}));
