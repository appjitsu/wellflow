'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Location = void 0;
var Location = (function () {
  function Location(coordinates, options) {
    if (!coordinates) {
      throw new Error('Coordinates are required');
    }
    if (
      (options === null || options === void 0 ? void 0 : options.address) === ''
    ) {
      throw new Error('Address cannot be empty if provided');
    }
    if (
      (options === null || options === void 0 ? void 0 : options.county) === ''
    ) {
      throw new Error('County cannot be empty if provided');
    }
    if (
      (options === null || options === void 0 ? void 0 : options.state) === ''
    ) {
      throw new Error('State cannot be empty if provided');
    }
    if (
      (options === null || options === void 0 ? void 0 : options.country) === ''
    ) {
      throw new Error('Country cannot be empty if provided');
    }
    this.coordinates = coordinates;
    this.address =
      options === null || options === void 0 ? void 0 : options.address;
    this.county =
      options === null || options === void 0 ? void 0 : options.county;
    this.state =
      options === null || options === void 0 ? void 0 : options.state;
    this.country =
      (options === null || options === void 0 ? void 0 : options.country) ||
      'US';
  }
  Location.prototype.getCoordinates = function () {
    return this.coordinates;
  };
  Location.prototype.getAddress = function () {
    return this.address;
  };
  Location.prototype.getCounty = function () {
    return this.county;
  };
  Location.prototype.getState = function () {
    return this.state;
  };
  Location.prototype.getCountry = function () {
    return this.country;
  };
  Location.prototype.getFullAddress = function () {
    var addressParts = [this.address, this.county, this.state].filter(Boolean);
    if (addressParts.length > 0) {
      addressParts.push(this.country);
    }
    return addressParts.join(', ');
  };
  Location.prototype.distanceTo = function (other) {
    return this.coordinates.distanceTo(other.coordinates);
  };
  Location.prototype.equals = function (other) {
    if (!other) {
      return false;
    }
    return (
      this.coordinates.equals(other.coordinates) &&
      this.address === other.address &&
      this.county === other.county &&
      this.state === other.state &&
      this.country === other.country
    );
  };
  Location.prototype.toString = function () {
    var fullAddress = this.getFullAddress();
    if (fullAddress) {
      return ''
        .concat(fullAddress, ' (')
        .concat(this.coordinates.toString(), ')');
    }
    return this.coordinates.toString();
  };
  Location.prototype.toObject = function () {
    return {
      coordinates: this.coordinates.toObject(),
      address: this.address,
      county: this.county,
      state: this.state,
      country: this.country,
    };
  };
  Location.prototype.toJSON = function () {
    return this.toObject();
  };
  return Location;
})();
exports.Location = Location;
