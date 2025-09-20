'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Coordinates = void 0;
var Coordinates = (function () {
  function Coordinates(latitude, longitude) {
    this.validateCoordinates(latitude, longitude);
    this.latitude = latitude;
    this.longitude = longitude;
  }
  Coordinates.prototype.validateCoordinates = function (latitude, longitude) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  };
  Coordinates.prototype.getLatitude = function () {
    return this.latitude;
  };
  Coordinates.prototype.getLongitude = function () {
    return this.longitude;
  };
  Coordinates.prototype.distanceTo = function (other) {
    var R = 6371;
    var dLat = this.toRadians(other.latitude - this.latitude);
    var dLon = this.toRadians(other.longitude - this.longitude);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude)) *
        Math.cos(this.toRadians(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  Coordinates.prototype.toRadians = function (degrees) {
    return degrees * (Math.PI / 180);
  };
  Coordinates.prototype.equals = function (other) {
    if (!other) {
      return false;
    }
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  };
  Coordinates.prototype.toString = function () {
    var lat = this.latitude.toFixed(4);
    var lng = this.longitude.toFixed(4);
    return ''.concat(lat, ', ').concat(lng);
  };
  Coordinates.prototype.toObject = function () {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  };
  Coordinates.prototype.toJSON = function () {
    return this.toObject();
  };
  return Coordinates;
})();
exports.Coordinates = Coordinates;
