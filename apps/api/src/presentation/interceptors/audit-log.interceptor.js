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
exports.AuditLogInterceptor = void 0;
var common_1 = require('@nestjs/common');
var operators_1 = require('rxjs/operators');
var AuditLogInterceptor = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var AuditLogInterceptor = (_classThis = (function () {
    function AuditLogInterceptor_1(reflector) {
      this.reflector = reflector;
    }
    AuditLogInterceptor_1.prototype.intercept = function (context, next) {
      var _this = this;
      var auditOptions = this.reflector.getAllAndOverride('auditLog', [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!auditOptions) {
        return next.handle();
      }
      var request = context.switchToHttp().getRequest();
      var user = request.user;
      var startTime = Date.now();
      return next.handle().pipe(
        (0, operators_1.tap)({
          next: function (response) {
            _this.logAuditEvent({
              action: auditOptions.action,
              resource: auditOptions.resource || context.getClass().name,
              description: auditOptions.description,
              userId: user === null || user === void 0 ? void 0 : user.id,
              userEmail: user === null || user === void 0 ? void 0 : user.email,
              ipAddress: request.ip,
              userAgent: request.get('User-Agent'),
              method: request.method,
              url: request.url,
              statusCode: context.switchToHttp().getResponse().statusCode,
              duration: Date.now() - startTime,
              success: true,
              timestamp: new Date(),
            });
          },
          error: function (error) {
            _this.logAuditEvent({
              action: auditOptions.action,
              resource: auditOptions.resource || context.getClass().name,
              description: auditOptions.description,
              userId: user === null || user === void 0 ? void 0 : user.id,
              userEmail: user === null || user === void 0 ? void 0 : user.email,
              ipAddress: request.ip,
              userAgent: request.get('User-Agent'),
              method: request.method,
              url: request.url,
              statusCode: error.status || 500,
              duration: Date.now() - startTime,
              success: false,
              error: error.message,
              timestamp: new Date(),
            });
          },
        }),
      );
    };
    AuditLogInterceptor_1.prototype.logAuditEvent = function (auditData) {
      console.log('AUDIT_LOG:', JSON.stringify(auditData, null, 2));
    };
    return AuditLogInterceptor_1;
  })());
  __setFunctionName(_classThis, 'AuditLogInterceptor');
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
    AuditLogInterceptor = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (AuditLogInterceptor = _classThis);
})();
exports.AuditLogInterceptor = AuditLogInterceptor;
