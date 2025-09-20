'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AuditLog = void 0;
var common_1 = require('@nestjs/common');
var AuditLog = function (options) {
  return (0, common_1.SetMetadata)('auditLog', options);
};
exports.AuditLog = AuditLog;
