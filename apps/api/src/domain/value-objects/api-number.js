'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ApiNumber = void 0;
var ApiNumber = (function () {
  function ApiNumber(value) {
    this.validateApiNumber(value);
    this.value = this.formatApiNumber(value);
  }
  ApiNumber.prototype.validateApiNumber = function (value) {
    if (!value) {
      throw new Error('API Number cannot be empty');
    }
    var cleanValue = value.replace(/[-\s]/g, '');
    if (!/^\d{10}$/.test(cleanValue)) {
      throw new Error('API Number must be exactly 10 digits');
    }
    var stateCode = parseInt(cleanValue.substring(0, 2));
    if (stateCode < 1 || stateCode > 56) {
      throw new Error('Invalid state code in API Number');
    }
  };
  ApiNumber.prototype.formatApiNumber = function (value) {
    var cleanValue = value.replace(/[-\s]/g, '');
    return ''
      .concat(cleanValue.substring(0, 2), '-')
      .concat(cleanValue.substring(2, 5), '-')
      .concat(cleanValue.substring(5));
  };
  ApiNumber.prototype.getValue = function () {
    return this.value;
  };
  ApiNumber.prototype.getStateCode = function () {
    return this.value.substring(0, 2);
  };
  ApiNumber.prototype.getCountyCode = function () {
    return this.value.substring(3, 6);
  };
  ApiNumber.prototype.getUniqueNumber = function () {
    return this.value.substring(7);
  };
  ApiNumber.prototype.equals = function (other) {
    if (!other) {
      return false;
    }
    return this.value === other.value;
  };
  ApiNumber.prototype.toString = function () {
    return this.value;
  };
  return ApiNumber;
})();
exports.ApiNumber = ApiNumber;
