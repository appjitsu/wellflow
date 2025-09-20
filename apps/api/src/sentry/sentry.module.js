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
exports.SentryModule = void 0;
var common_1 = require('@nestjs/common');
var config_1 = require('@nestjs/config');
var Sentry = require('@sentry/nestjs');
var sentry_service_1 = require('./sentry.service');
var SentryModule = (function () {
  var _classDecorators = [
    (0, common_1.Global)(),
    (0, common_1.Module)({
      imports: [config_1.ConfigModule],
      providers: [
        {
          provide: 'SENTRY_INIT',
          useFactory: function (configService) {
            var dsn = configService.get('SENTRY_DSN');
            var environment = configService.get(
              'SENTRY_ENVIRONMENT',
              'development',
            );
            var release = configService.get('SENTRY_RELEASE', '1.0.0');
            if (dsn) {
              Sentry.init({
                dsn: dsn,
                environment: environment,
                release: release,
                tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
                profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
                integrations: [
                  Sentry.httpIntegration(),
                  Sentry.expressIntegration(),
                  Sentry.nodeContextIntegration(),
                ],
                beforeSend: function (event) {
                  var _a;
                  if (
                    (_a = event.request) === null || _a === void 0
                      ? void 0
                      : _a.headers
                  ) {
                    delete event.request.headers.authorization;
                    delete event.request.headers.cookie;
                  }
                  return event;
                },
              });
              console.log('✅ Sentry initialized for API');
            } else {
              console.log(
                '⚠️  Sentry DSN not configured, skipping initialization',
              );
            }
            return Sentry;
          },
          inject: [config_1.ConfigService],
        },
        sentry_service_1.SentryService,
      ],
      exports: [sentry_service_1.SentryService],
    }),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var SentryModule = (_classThis = (function () {
    function SentryModule_1() {}
    return SentryModule_1;
  })());
  __setFunctionName(_classThis, 'SentryModule');
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
    SentryModule = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (SentryModule = _classThis);
})();
exports.SentryModule = SentryModule;
