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
exports.UpdateWellStatusDto = void 0;
var swagger_1 = require('@nestjs/swagger');
var class_validator_1 = require('class-validator');
var well_status_enum_1 = require('../../domain/enums/well-status.enum');
var UpdateWellStatusDto = (function () {
  var _a;
  var _status_decorators;
  var _status_initializers = [];
  var _status_extraInitializers = [];
  var _reason_decorators;
  var _reason_initializers = [];
  var _reason_extraInitializers = [];
  return (
    (_a = (function () {
      function UpdateWellStatusDto() {
        this.status = __runInitializers(this, _status_initializers, void 0);
        this.reason =
          (__runInitializers(this, _status_extraInitializers),
          __runInitializers(this, _reason_initializers, void 0));
        __runInitializers(this, _reason_extraInitializers);
      }
      return UpdateWellStatusDto;
    })()),
    (function () {
      var _metadata =
        typeof Symbol === 'function' && Symbol.metadata
          ? Object.create(null)
          : void 0;
      _status_decorators = [
        (0, swagger_1.ApiProperty)({
          enum: well_status_enum_1.WellStatus,
          description: 'New well status',
        }),
        (0, class_validator_1.IsEnum)(well_status_enum_1.WellStatus),
      ];
      _reason_decorators = [
        (0, swagger_1.ApiProperty)({
          description: 'Reason for status change',
          required: false,
        }),
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)(),
      ];
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
        _reason_decorators,
        {
          kind: 'field',
          name: 'reason',
          static: false,
          private: false,
          access: {
            has: function (obj) {
              return 'reason' in obj;
            },
            get: function (obj) {
              return obj.reason;
            },
            set: function (obj, value) {
              obj.reason = value;
            },
          },
          metadata: _metadata,
        },
        _reason_initializers,
        _reason_extraInitializers,
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
exports.UpdateWellStatusDto = UpdateWellStatusDto;
