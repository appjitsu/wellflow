'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CanAuditWells =
  exports.CanExportWells =
  exports.CanSubmitReport =
  exports.CanDeleteWell =
  exports.CanUpdateWellStatus =
  exports.CanUpdateWell =
  exports.CanReadWell =
  exports.CanCreateWell =
  exports.CheckAbilities =
  exports.CHECK_ABILITIES_KEY =
    void 0;
var common_1 = require('@nestjs/common');
exports.CHECK_ABILITIES_KEY = 'check_abilities';
var CheckAbilities = function () {
  var requirements = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    requirements[_i] = arguments[_i];
  }
  return (0, common_1.SetMetadata)(exports.CHECK_ABILITIES_KEY, requirements);
};
exports.CheckAbilities = CheckAbilities;
var CanCreateWell = function () {
  return (0, exports.CheckAbilities)({ action: 'create', subject: 'Well' });
};
exports.CanCreateWell = CanCreateWell;
var CanReadWell = function () {
  return (0, exports.CheckAbilities)({ action: 'read', subject: 'Well' });
};
exports.CanReadWell = CanReadWell;
var CanUpdateWell = function () {
  return (0, exports.CheckAbilities)({ action: 'update', subject: 'Well' });
};
exports.CanUpdateWell = CanUpdateWell;
var CanUpdateWellStatus = function () {
  return (0, exports.CheckAbilities)({
    action: 'updateStatus',
    subject: 'Well',
  });
};
exports.CanUpdateWellStatus = CanUpdateWellStatus;
var CanDeleteWell = function () {
  return (0, exports.CheckAbilities)({ action: 'delete', subject: 'Well' });
};
exports.CanDeleteWell = CanDeleteWell;
var CanSubmitReport = function () {
  return (0, exports.CheckAbilities)({
    action: 'submitReport',
    subject: 'Well',
  });
};
exports.CanSubmitReport = CanSubmitReport;
var CanExportWells = function () {
  return (0, exports.CheckAbilities)({ action: 'export', subject: 'Well' });
};
exports.CanExportWells = CanExportWells;
var CanAuditWells = function () {
  return (0, exports.CheckAbilities)({ action: 'audit', subject: 'Well' });
};
exports.CanAuditWells = CanAuditWells;
