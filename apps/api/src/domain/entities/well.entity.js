'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Well = void 0;
var api_number_1 = require('../value-objects/api-number');
var location_1 = require('../value-objects/location');
var well_status_enum_1 = require('../enums/well-status.enum');
var well_status_changed_event_1 = require('../events/well-status-changed.event');
var Well = (function () {
  function Well(id, apiNumber, name, operatorId, wellType, location, options) {
    this.domainEvents = [];
    this.id = id;
    this.apiNumber = apiNumber;
    this.name = name;
    this.operatorId = operatorId;
    this.wellType = wellType;
    this.location = location;
    this.leaseId =
      options === null || options === void 0 ? void 0 : options.leaseId;
    this.status =
      (options === null || options === void 0 ? void 0 : options.status) ||
      well_status_enum_1.WellStatus.PLANNED;
    this.spudDate =
      options === null || options === void 0 ? void 0 : options.spudDate;
    this.completionDate =
      options === null || options === void 0 ? void 0 : options.completionDate;
    this.totalDepth =
      options === null || options === void 0 ? void 0 : options.totalDepth;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
  }
  Well.prototype.getId = function () {
    return this.id;
  };
  Well.prototype.getApiNumber = function () {
    return this.apiNumber;
  };
  Well.prototype.getName = function () {
    return this.name;
  };
  Well.prototype.getOperatorId = function () {
    return this.operatorId;
  };
  Well.prototype.getLeaseId = function () {
    return this.leaseId;
  };
  Well.prototype.getWellType = function () {
    return this.wellType;
  };
  Well.prototype.getStatus = function () {
    return this.status;
  };
  Well.prototype.getLocation = function () {
    return this.location;
  };
  Well.prototype.getSpudDate = function () {
    return this.spudDate;
  };
  Well.prototype.getCompletionDate = function () {
    return this.completionDate;
  };
  Well.prototype.getTotalDepth = function () {
    return this.totalDepth;
  };
  Well.prototype.getCreatedAt = function () {
    return this.createdAt;
  };
  Well.prototype.getUpdatedAt = function () {
    return this.updatedAt;
  };
  Well.prototype.getVersion = function () {
    return this.version;
  };
  Well.prototype.updateStatus = function (newStatus, updatedBy) {
    if (!this.isValidStatusTransition(this.status, newStatus)) {
      throw new Error(
        'Invalid status transition from '
          .concat(this.status, ' to ')
          .concat(newStatus),
      );
    }
    var previousStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.version++;
    this.addDomainEvent(
      new well_status_changed_event_1.WellStatusChangedEvent(
        this.id,
        this.apiNumber.getValue(),
        previousStatus,
        newStatus,
        updatedBy,
      ),
    );
  };
  Well.prototype.updateName = function (newName) {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Well name cannot be empty');
    }
    this.name = newName.trim();
    this.updatedAt = new Date();
    this.version++;
  };
  Well.prototype.setSpudDate = function (spudDate) {
    if (spudDate > new Date()) {
      throw new Error('Spud date cannot be in the future');
    }
    this.spudDate = spudDate;
    this.updatedAt = new Date();
    this.version++;
  };
  Well.prototype.setCompletionDate = function (completionDate) {
    if (this.spudDate && completionDate < this.spudDate) {
      throw new Error('Completion date cannot be before spud date');
    }
    this.completionDate = completionDate;
    this.updatedAt = new Date();
    this.version++;
  };
  Well.prototype.setTotalDepth = function (totalDepth) {
    if (totalDepth <= 0) {
      throw new Error('Total depth must be greater than 0');
    }
    this.totalDepth = totalDepth;
    this.updatedAt = new Date();
    this.version++;
  };
  Well.prototype.getDomainEvents = function () {
    return __spreadArray([], this.domainEvents, true);
  };
  Well.prototype.clearDomainEvents = function () {
    this.domainEvents = [];
  };
  Well.prototype.addDomainEvent = function (event) {
    this.domainEvents.push(event);
  };
  Well.prototype.isValidStatusTransition = function (from, to) {
    var _a;
    var _b;
    var validTransitions =
      ((_a = {}),
      (_a[well_status_enum_1.WellStatus.PLANNED] = [
        well_status_enum_1.WellStatus.PERMITTED,
        well_status_enum_1.WellStatus.DRILLING,
      ]),
      (_a[well_status_enum_1.WellStatus.PERMITTED] = [
        well_status_enum_1.WellStatus.DRILLING,
        well_status_enum_1.WellStatus.PLANNED,
      ]),
      (_a[well_status_enum_1.WellStatus.DRILLING] = [
        well_status_enum_1.WellStatus.COMPLETED,
        well_status_enum_1.WellStatus.TEMPORARILY_ABANDONED,
      ]),
      (_a[well_status_enum_1.WellStatus.COMPLETED] = [
        well_status_enum_1.WellStatus.PRODUCING,
        well_status_enum_1.WellStatus.SHUT_IN,
      ]),
      (_a[well_status_enum_1.WellStatus.PRODUCING] = [
        well_status_enum_1.WellStatus.SHUT_IN,
        well_status_enum_1.WellStatus.TEMPORARILY_ABANDONED,
      ]),
      (_a[well_status_enum_1.WellStatus.SHUT_IN] = [
        well_status_enum_1.WellStatus.PRODUCING,
        well_status_enum_1.WellStatus.TEMPORARILY_ABANDONED,
      ]),
      (_a[well_status_enum_1.WellStatus.TEMPORARILY_ABANDONED] = [
        well_status_enum_1.WellStatus.PERMANENTLY_ABANDONED,
        well_status_enum_1.WellStatus.PRODUCING,
      ]),
      (_a[well_status_enum_1.WellStatus.PERMANENTLY_ABANDONED] = [
        well_status_enum_1.WellStatus.PLUGGED,
      ]),
      (_a[well_status_enum_1.WellStatus.PLUGGED] = []),
      (_a[well_status_enum_1.WellStatus.UNKNOWN] = Object.values(
        well_status_enum_1.WellStatus,
      )),
      _a);
    return (
      ((_b = validTransitions[from]) === null || _b === void 0
        ? void 0
        : _b.includes(to)) || false
    );
  };
  Well.fromPersistence = function (data) {
    var well = new Well(
      data.id,
      new api_number_1.ApiNumber(data.apiNumber),
      data.name,
      data.operatorId,
      data.wellType,
      new location_1.Location(data.location.coordinates, {
        address: data.location.address,
        county: data.location.county,
        state: data.location.state,
        country: data.location.country,
      }),
      {
        leaseId: data.leaseId,
        status: data.status,
        spudDate: data.spudDate,
        completionDate: data.completionDate,
        totalDepth: data.totalDepth,
      },
    );
    well.createdAt = data.createdAt;
    well.updatedAt = data.updatedAt;
    well.version = data.version;
    return well;
  };
  return Well;
})();
exports.Well = Well;
