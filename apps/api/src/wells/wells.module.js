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
var __setFunctionName =
  (this && this.__setFunctionName) ||
  function (f, name, prefix) {
    if (typeof name === 'symbol')
      name = name.description ? '['.concat(name.description, ']') : '';
    return Object.defineProperty(f, 'name', {
      configurable: true,
      value: prefix ? ''.concat(prefix, ' ', name) : name,
    });
  };
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
exports.WellsModule = void 0;
var common_1 = require('@nestjs/common');
var cqrs_1 = require('@nestjs/cqrs');
var wells_controller_1 = require('../presentation/controllers/wells.controller');
var create_well_handler_1 = require('../application/handlers/create-well.handler');
var update_well_status_handler_1 = require('../application/handlers/update-well-status.handler');
var get_well_by_id_handler_1 = require('../application/handlers/get-well-by-id.handler');
var get_wells_by_operator_handler_1 = require('../application/handlers/get-wells-by-operator.handler');
var well_repository_1 = require('../infrastructure/repositories/well.repository');
var database_module_1 = require('../database/database.module');
var authorization_module_1 = require('../authorization/authorization.module');
var CommandHandlers = [
  create_well_handler_1.CreateWellHandler,
  update_well_status_handler_1.UpdateWellStatusHandler,
];
var QueryHandlers = [
  get_well_by_id_handler_1.GetWellByIdHandler,
  get_wells_by_operator_handler_1.GetWellsByOperatorHandler,
];
var Repositories = [
  {
    provide: 'WellRepository',
    useClass: well_repository_1.WellRepositoryImpl,
  },
];
var WellsModule = (function () {
  var _classDecorators = [
    (0, common_1.Module)({
      imports: [
        cqrs_1.CqrsModule,
        database_module_1.DatabaseModule,
        authorization_module_1.AuthorizationModule,
      ],
      controllers: [wells_controller_1.WellsController],
      providers: __spreadArray(
        __spreadArray(
          __spreadArray([], CommandHandlers, true),
          QueryHandlers,
          true,
        ),
        Repositories,
        true,
      ),
      exports: __spreadArray([], Repositories, true),
    }),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var WellsModule = (_classThis = (function () {
    function WellsModule_1() {}
    return WellsModule_1;
  })());
  __setFunctionName(_classThis, 'WellsModule');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    WellsModule = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (WellsModule = _classThis);
})();
exports.WellsModule = WellsModule;
