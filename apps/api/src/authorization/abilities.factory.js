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
Object.defineProperty(exports, '__esModule', { value: true });
exports.AbilitiesFactory = void 0;
var common_1 = require('@nestjs/common');
var ability_1 = require('@casl/ability');
var well_status_enum_1 = require('../domain/enums/well-status.enum');
var AbilitiesFactory = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var AbilitiesFactory = (_classThis = (function () {
    function AbilitiesFactory_1() {}
    AbilitiesFactory_1.prototype.createForUser = function (user) {
      var _a = new ability_1.AbilityBuilder(ability_1.createMongoAbility),
        can = _a.can,
        cannot = _a.cannot,
        rules = _a.rules;
      if (user.roles.includes('ADMIN')) {
        can('manage', 'all');
        return (0, ability_1.createMongoAbility)(rules, {
          detectSubjectType: function (item) {
            if (item && item.constructor && item.constructor.name === 'Well') {
              return 'Well';
            }
            return item.constructor;
          },
        });
      }
      if (user.roles.includes('OPERATOR')) {
        can('create', 'Well');
        can('read', 'Well');
        can('update', 'Well');
        can('updateStatus', 'Well');
        can('submitReport', 'Well');
        can('export', 'Well');
        cannot('delete', 'Well');
        cannot('audit', 'Well');
        can('read', 'User');
      }
      if (user.roles.includes('VIEWER')) {
        can('read', 'Well');
        cannot('create', 'Well');
        cannot('update', 'Well');
        cannot('delete', 'Well');
        cannot('updateStatus', 'Well');
        cannot('submitReport', 'Well');
        cannot('export', 'Well');
        cannot('audit', 'Well');
        can('read', 'User');
      }
      if (user.roles.includes('REGULATOR')) {
        can('read', 'Well');
        can('viewSensitive', 'Well');
        can('audit', 'Well');
        cannot('create', 'Well');
        cannot('update', 'Well');
        cannot('delete', 'Well');
        cannot('updateStatus', 'Well');
      }
      if (user.roles.includes('AUDITOR')) {
        can('audit', 'Well');
        can('read', 'Well');
        cannot('create', 'Well');
        cannot('update', 'Well');
        cannot('delete', 'Well');
        cannot('updateStatus', 'Well');
        cannot('submitReport', 'Well');
      }
      return (0, ability_1.createMongoAbility)(rules, {
        detectSubjectType: function (item) {
          if (item && item.constructor && item.constructor.name === 'Well') {
            return 'Well';
          }
          return item.constructor;
        },
      });
    };
    AbilitiesFactory_1.prototype.createForWellOperation = function (
      user,
      well,
      operation,
    ) {
      var ability = this.createForUser(user);
      switch (operation) {
        case 'drilling':
          return (
            ability.can('updateStatus', well) &&
            [
              well_status_enum_1.WellStatus.PLANNED,
              well_status_enum_1.WellStatus.PERMITTED,
            ].includes(well.getStatus())
          );
        case 'completion':
          return (
            ability.can('updateStatus', well) &&
            well.getStatus() === well_status_enum_1.WellStatus.DRILLING
          );
        case 'production':
          return (
            ability.can('updateStatus', well) &&
            well.getStatus() === well_status_enum_1.WellStatus.COMPLETED
          );
        case 'abandonment':
          return (
            ability.can('updateStatus', well) &&
            well.getStatus() !== well_status_enum_1.WellStatus.PLUGGED
          );
        default:
          return ability.can('update', well);
      }
    };
    AbilitiesFactory_1.prototype.createForGuest = function () {
      var _a = new ability_1.AbilityBuilder(ability_1.createMongoAbility),
        can = _a.can,
        cannot = _a.cannot,
        rules = _a.rules;
      can('read', 'Well', { isPublic: true });
      cannot('create', 'all');
      cannot('update', 'all');
      cannot('delete', 'all');
      cannot('manage', 'all');
      return (0, ability_1.createMongoAbility)(rules, {
        detectSubjectType: function (item) {
          if (item && item.constructor && item.constructor.name === 'Well') {
            return 'Well';
          }
          return item.constructor;
        },
      });
    };
    return AbilitiesFactory_1;
  })());
  __setFunctionName(_classThis, 'AbilitiesFactory');
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
    AbilitiesFactory = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (AbilitiesFactory = _classThis);
})();
exports.AbilitiesFactory = AbilitiesFactory;
