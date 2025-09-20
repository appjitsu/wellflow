'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.LogRocketService = void 0;
var common_1 = require('@nestjs/common');
var LogRocket = require('logrocket');
var LogRocketService = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var LogRocketService = (_classThis = (function () {
    function LogRocketService_1() {
      this.isInitialized = false;
      this.initialize();
    }
    LogRocketService_1.prototype.initialize = function () {
      var appId = process.env.LOGROCKET_APP_ID;
      if (!appId) {
        console.warn(
          'LogRocket: LOGROCKET_APP_ID not found in environment variables',
        );
        return;
      }
      try {
        LogRocket.init(appId, {
          network: {
            requestSanitizer: function (request) {
              var _a, _b;
              if (
                (_a = request.headers) === null || _a === void 0
                  ? void 0
                  : _a.authorization
              ) {
                request.headers.authorization = '[REDACTED]';
              }
              if (
                (_b = request.headers) === null || _b === void 0
                  ? void 0
                  : _b.cookie
              ) {
                request.headers.cookie = '[REDACTED]';
              }
              return request;
            },
            responseSanitizer: function (response) {
              return response;
            },
          },
          console: {
            shouldAggregateConsoleErrors: true,
          },
        });
        this.isInitialized = true;
        console.log('✅ LogRocket initialized successfully');
      } catch (error) {
        console.error('❌ LogRocket initialization failed:', error);
      }
    };
    LogRocketService_1.prototype.identify = function (userId, userInfo) {
      if (!this.isInitialized) {
        console.warn('LogRocket: Service not initialized');
        return;
      }
      try {
        LogRocket.identify(
          userId,
          __assign(__assign({}, userInfo), {
            server: true,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error('LogRocket identify error:', error);
      }
    };
    LogRocketService_1.prototype.track = function (eventName, properties) {
      if (!this.isInitialized) {
        console.warn('LogRocket: Service not initialized');
        return;
      }
      try {
        LogRocket.track(
          eventName,
          __assign(__assign({}, properties), {
            server: true,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error('LogRocket track error:', error);
      }
    };
    LogRocketService_1.prototype.log = function (message, level, extra) {
      if (level === void 0) {
        level = 'info';
      }
      if (!this.isInitialized) {
        console.warn('LogRocket: Service not initialized');
        return;
      }
      try {
        LogRocket.log(
          message,
          __assign(__assign({ level: level }, extra), {
            server: true,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error('LogRocket log error:', error);
      }
    };
    LogRocketService_1.prototype.captureException = function (error, extra) {
      if (!this.isInitialized) {
        console.warn('LogRocket: Service not initialized');
        return;
      }
      try {
        LogRocket.captureException(error);
      } catch (logRocketError) {
        console.error('LogRocket captureException error:', logRocketError);
      }
    };
    LogRocketService_1.prototype.getSessionURL = function () {
      if (!this.isInitialized) {
        console.warn('LogRocket: Service not initialized');
        return Promise.resolve(null);
      }
      return new Promise(function (resolve) {
        try {
          LogRocket.getSessionURL(function (sessionURL) {
            resolve(sessionURL);
          });
        } catch (error) {
          console.error('LogRocket getSessionURL error:', error);
          resolve(null);
        }
      });
    };
    LogRocketService_1.prototype.addTag = function (key, value) {
      if (!this.isInitialized) {
        console.warn('LogRocket: Service not initialized');
        return;
      }
      try {
        LogRocket.track('Tag Added', {
          tagKey: key,
          tagValue: value,
          server: true,
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('LogRocket addTag error:', error);
      }
    };
    LogRocketService_1.prototype.isReady = function () {
      return this.isInitialized;
    };
    return LogRocketService_1;
  })());
  __setFunctionName(_classThis, 'LogRocketService');
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
    LogRocketService = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (LogRocketService = _classThis);
})();
exports.LogRocketService = LogRocketService;
