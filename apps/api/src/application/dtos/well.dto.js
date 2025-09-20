'use strict';
var __esDecorate =
  (this && this.__esDecorate) ||
  function (
    ctor,
    descriptorIn,
    decorators,
    contextIn,
    initializers,
    extraInitializers,
  ) {
    function accept(f) {
      if (f !== void 0 && typeof f !== 'function')
        throw new TypeError('Function expected');
      return f;
    }
    var kind = contextIn.kind,
      key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
    var target =
      !descriptorIn && ctor
        ? contextIn['static']
          ? ctor
          : ctor.prototype
        : null;
    var descriptor =
      descriptorIn ||
      (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _,
      done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            'Cannot add initializers after decoration has completed',
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === 'accessor'
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === 'accessor') {
        if (result === void 0) continue;
        if (result === null || typeof result !== 'object')
          throw new TypeError('Object expected');
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === 'field') initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  };
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue
        ? initializers[i].call(thisArg, value)
        : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.WellDto = void 0;
var swagger_1 = require('@nestjs/swagger');
var well_status_enum_1 = require('../../domain/enums/well-status.enum');
var WellDto = (function () {
  var _a;
  var _id_decorators;
  var _id_initializers = [];
  var _id_extraInitializers = [];
  var _apiNumber_decorators;
  var _apiNumber_initializers = [];
  var _apiNumber_extraInitializers = [];
  var _name_decorators;
  var _name_initializers = [];
  var _name_extraInitializers = [];
  var _operatorId_decorators;
  var _operatorId_initializers = [];
  var _operatorId_extraInitializers = [];
  var _leaseId_decorators;
  var _leaseId_initializers = [];
  var _leaseId_extraInitializers = [];
  var _wellType_decorators;
  var _wellType_initializers = [];
  var _wellType_extraInitializers = [];
  var _status_decorators;
  var _status_initializers = [];
  var _status_extraInitializers = [];
  var _location_decorators;
  var _location_initializers = [];
  var _location_extraInitializers = [];
  var _spudDate_decorators;
  var _spudDate_initializers = [];
  var _spudDate_extraInitializers = [];
  var _completionDate_decorators;
  var _completionDate_initializers = [];
  var _completionDate_extraInitializers = [];
  var _totalDepth_decorators;
  var _totalDepth_initializers = [];
  var _totalDepth_extraInitializers = [];
  var _createdAt_decorators;
  var _createdAt_initializers = [];
  var _createdAt_extraInitializers = [];
  var _updatedAt_decorators;
  var _updatedAt_initializers = [];
  var _updatedAt_extraInitializers = [];
  var _version_decorators;
  var _version_initializers = [];
  var _version_extraInitializers = [];
  return (
    (_a = (function () {
      function WellDto() {
        this.id = __runInitializers(this, _id_initializers, void 0);
        this.apiNumber =
          (__runInitializers(this, _id_extraInitializers),
          __runInitializers(this, _apiNumber_initializers, void 0));
        this.name =
          (__runInitializers(this, _apiNumber_extraInitializers),
          __runInitializers(this, _name_initializers, void 0));
        this.operatorId =
          (__runInitializers(this, _name_extraInitializers),
          __runInitializers(this, _operatorId_initializers, void 0));
        this.leaseId =
          (__runInitializers(this, _operatorId_extraInitializers),
          __runInitializers(this, _leaseId_initializers, void 0));
        this.wellType =
          (__runInitializers(this, _leaseId_extraInitializers),
          __runInitializers(this, _wellType_initializers, void 0));
        this.status =
          (__runInitializers(this, _wellType_extraInitializers),
          __runInitializers(this, _status_initializers, void 0));
        this.location =
          (__runInitializers(this, _status_extraInitializers),
          __runInitializers(this, _location_initializers, void 0));
        this.spudDate =
          (__runInitializers(this, _location_extraInitializers),
          __runInitializers(this, _spudDate_initializers, void 0));
        this.completionDate =
          (__runInitializers(this, _spudDate_extraInitializers),
          __runInitializers(this, _completionDate_initializers, void 0));
        this.totalDepth =
          (__runInitializers(this, _completionDate_extraInitializers),
          __runInitializers(this, _totalDepth_initializers, void 0));
        this.createdAt =
          (__runInitializers(this, _totalDepth_extraInitializers),
          __runInitializers(this, _createdAt_initializers, void 0));
        this.updatedAt =
          (__runInitializers(this, _createdAt_extraInitializers),
          __runInitializers(this, _updatedAt_initializers, void 0));
        this.version =
          (__runInitializers(this, _updatedAt_extraInitializers),
          __runInitializers(this, _version_initializers, void 0));
        __runInitializers(this, _version_extraInitializers);
      }
      WellDto.fromEntity = function (well) {
        return {
          id: well.getId(),
          apiNumber: well.getApiNumber().getValue(),
          name: well.getName(),
          operatorId: well.getOperatorId(),
          leaseId: well.getLeaseId(),
          wellType: well.getWellType(),
          status: well.getStatus(),
          location: well.getLocation().toObject(),
          spudDate: well.getSpudDate(),
          completionDate: well.getCompletionDate(),
          totalDepth: well.getTotalDepth(),
          createdAt: well.getCreatedAt(),
          updatedAt: well.getUpdatedAt(),
          version: well.getVersion(),
        };
      };
      return WellDto;
    })()),
    (function () {
      var _metadata =
        typeof Symbol === 'function' && Symbol.metadata
          ? Object.create(null)
          : void 0;
      _id_decorators = [
        (0, swagger_1.ApiProperty)({ description: 'Well unique identifier' }),
      ];
      _apiNumber_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'API Number (formatted)',
          example: '42-123-12345',
        }),
      ];
      _name_decorators = [
        (0, swagger_1.ApiProperty)({ description: 'Well name' }),
      ];
      _operatorId_decorators = [
        (0, swagger_1.ApiProperty)({ description: 'Operator ID' }),
      ];
      _leaseId_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'Lease ID',
          required: false,
        }),
      ];
      _wellType_decorators = [
        (0, swagger_1.ApiProperty)({
          enum: well_status_enum_1.WellType,
          description: 'Type of well',
        }),
      ];
      _status_decorators = [
        (0, swagger_1.ApiProperty)({
          enum: well_status_enum_1.WellStatus,
          description: 'Current well status',
        }),
      ];
      _location_decorators = [
        (0, swagger_1.ApiProperty)({ description: 'Well location' }),
      ];
      _spudDate_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'Spud date',
          required: false,
        }),
      ];
      _completionDate_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'Completion date',
          required: false,
        }),
      ];
      _totalDepth_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'Total depth in feet',
          required: false,
        }),
      ];
      _createdAt_decorators = [
        (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
      ];
      _updatedAt_decorators = [
        (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
      ];
      _version_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'Version for optimistic locking',
        }),
      ];
      __esDecorate(
        null,
        null,
        _id_decorators,
        {
          kind: 'field',
          name: 'id',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'id' in obj;
            },
            get: function (obj) {
              return obj.id;
            },
            set: function (obj, value) {
              obj.id = value;
            },
          },
          metadata: _metadata,
        },
        _id_initializers,
        _id_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _apiNumber_decorators,
        {
          kind: 'field',
          name: 'apiNumber',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'apiNumber' in obj;
            },
            get: function (obj) {
              return obj.apiNumber;
            },
            set: function (obj, value) {
              obj.apiNumber = value;
            },
          },
          metadata: _metadata,
        },
        _apiNumber_initializers,
        _apiNumber_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _name_decorators,
        {
          kind: 'field',
          name: 'name',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'name' in obj;
            },
            get: function (obj) {
              return obj.name;
            },
            set: function (obj, value) {
              obj.name = value;
            },
          },
          metadata: _metadata,
        },
        _name_initializers,
        _name_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _operatorId_decorators,
        {
          kind: 'field',
          name: 'operatorId',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'operatorId' in obj;
            },
            get: function (obj) {
              return obj.operatorId;
            },
            set: function (obj, value) {
              obj.operatorId = value;
            },
          },
          metadata: _metadata,
        },
        _operatorId_initializers,
        _operatorId_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _leaseId_decorators,
        {
          kind: 'field',
          name: 'leaseId',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'leaseId' in obj;
            },
            get: function (obj) {
              return obj.leaseId;
            },
            set: function (obj, value) {
              obj.leaseId = value;
            },
          },
          metadata: _metadata,
        },
        _leaseId_initializers,
        _leaseId_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _wellType_decorators,
        {
          kind: 'field',
          name: 'wellType',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'wellType' in obj;
            },
            get: function (obj) {
              return obj.wellType;
            },
            set: function (obj, value) {
              obj.wellType = value;
            },
          },
          metadata: _metadata,
        },
        _wellType_initializers,
        _wellType_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _status_decorators,
        {
          kind: 'field',
          name: 'status',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'status' in obj;
            },
            get: function (obj) {
              return obj.status;
            },
            set: function (obj, value) {
              obj.status = value;
            },
          },
          metadata: _metadata,
        },
        _status_initializers,
        _status_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _location_decorators,
        {
          kind: 'field',
          name: 'location',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'location' in obj;
            },
            get: function (obj) {
              return obj.location;
            },
            set: function (obj, value) {
              obj.location = value;
            },
          },
          metadata: _metadata,
        },
        _location_initializers,
        _location_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _spudDate_decorators,
        {
          kind: 'field',
          name: 'spudDate',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'spudDate' in obj;
            },
            get: function (obj) {
              return obj.spudDate;
            },
            set: function (obj, value) {
              obj.spudDate = value;
            },
          },
          metadata: _metadata,
        },
        _spudDate_initializers,
        _spudDate_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _completionDate_decorators,
        {
          kind: 'field',
          name: 'completionDate',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'completionDate' in obj;
            },
            get: function (obj) {
              return obj.completionDate;
            },
            set: function (obj, value) {
              obj.completionDate = value;
            },
          },
          metadata: _metadata,
        },
        _completionDate_initializers,
        _completionDate_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _totalDepth_decorators,
        {
          kind: 'field',
          name: 'totalDepth',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'totalDepth' in obj;
            },
            get: function (obj) {
              return obj.totalDepth;
            },
            set: function (obj, value) {
              obj.totalDepth = value;
            },
          },
          metadata: _metadata,
        },
        _totalDepth_initializers,
        _totalDepth_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _createdAt_decorators,
        {
          kind: 'field',
          name: 'createdAt',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'createdAt' in obj;
            },
            get: function (obj) {
              return obj.createdAt;
            },
            set: function (obj, value) {
              obj.createdAt = value;
            },
          },
          metadata: _metadata,
        },
        _createdAt_initializers,
        _createdAt_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _updatedAt_decorators,
        {
          kind: 'field',
          name: 'updatedAt',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'updatedAt' in obj;
            },
            get: function (obj) {
              return obj.updatedAt;
            },
            set: function (obj, value) {
              obj.updatedAt = value;
            },
          },
          metadata: _metadata,
        },
        _updatedAt_initializers,
        _updatedAt_extraInitializers,
      );
      __esDecorate(
        null,
        null,
        _version_decorators,
        {
          kind: 'field',
          name: 'version',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'version' in obj;
            },
            get: function (obj) {
              return obj.version;
            },
            set: function (obj, value) {
              obj.version = value;
            },
          },
          metadata: _metadata,
        },
        _version_initializers,
        _version_extraInitializers,
      );
      if (_metadata)
        Object.defineProperty(_a, Symbol.metadata, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: _metadata,
        });
    })(),
    _a
  );
})();
exports.WellDto = WellDto;
