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
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.MonitoringController = void 0;
var common_1 = require('@nestjs/common');
var swagger_1 = require('@nestjs/swagger');
var MonitoringController = (function () {
  var _classDecorators = [
    (0, swagger_1.ApiTags)('Monitoring'),
    (0, common_1.Controller)('monitoring'),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var _instanceExtraInitializers = [];
  var _getHealth_decorators;
  var _testError_decorators;
  var _testLog_decorators;
  var _testTrack_decorators;
  var _identifyUser_decorators;
  var _getSessionUrl_decorators;
  var MonitoringController = (_classThis = (function () {
    function MonitoringController_1(sentryService, logRocketService) {
      this.sentryService =
        (__runInitializers(this, _instanceExtraInitializers), sentryService);
      this.logRocketService = logRocketService;
    }
    MonitoringController_1.prototype.getHealth = function () {
      return {
        timestamp: new Date().toISOString(),
        services: {
          sentry: {
            status: 'active',
            description: 'Error tracking and performance monitoring',
          },
          logRocket: {
            status: this.logRocketService.isReady() ? 'active' : 'inactive',
            description: 'Session recording and API monitoring',
          },
        },
      };
    };
    MonitoringController_1.prototype.testError = function (body) {
      var errorMessage =
        (body === null || body === void 0 ? void 0 : body.message) ||
        'Test API error for monitoring';
      this.logRocketService.log('About to throw test error', 'warn', {
        requestedMessage:
          body === null || body === void 0 ? void 0 : body.message,
        endpoint: '/monitoring/test-error',
      });
      throw new common_1.HttpException(
        errorMessage,
        common_1.HttpStatus.INTERNAL_SERVER_ERROR,
      );
    };
    MonitoringController_1.prototype.testLog = function (body) {
      var message = body.message,
        _a = body.level,
        level = _a === void 0 ? 'info' : _a;
      this.logRocketService.log(message, level, {
        endpoint: '/monitoring/test-log',
        timestamp: new Date().toISOString(),
      });
      var sentryLevel = level === 'warn' ? 'warning' : level;
      this.sentryService.captureMessage(
        'API Log: '.concat(message),
        sentryLevel,
        'TEST_LOG',
      );
      return {
        success: true,
        message: 'Log message sent to monitoring services',
        data: { message: message, level: level },
      };
    };
    MonitoringController_1.prototype.testTrack = function (body) {
      var event = body.event,
        _a = body.properties,
        properties = _a === void 0 ? {} : _a;
      this.logRocketService.track(
        event,
        __assign(__assign({}, properties), {
          endpoint: '/monitoring/test-track',
          timestamp: new Date().toISOString(),
        }),
      );
      return {
        success: true,
        message: 'Event tracked successfully',
        data: { event: event, properties: properties },
      };
    };
    MonitoringController_1.prototype.identifyUser = function (body) {
      var userId = body.userId,
        email = body.email,
        username = body.username;
      this.sentryService.setUser({
        id: userId,
        email: email,
        username: username,
      });
      return {
        success: true,
        message: 'User identified in monitoring services',
        data: { userId: userId, email: email, username: username },
      };
    };
    MonitoringController_1.prototype.getSessionUrl = function () {
      return __awaiter(this, void 0, void 0, function () {
        var sessionURL;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (!this.logRocketService.isReady()) {
                return [
                  2,
                  {
                    success: false,
                    message: 'LogRocket is not initialized',
                    sessionURL: null,
                  },
                ];
              }
              return [4, this.logRocketService.getSessionURL()];
            case 1:
              sessionURL = _a.sent();
              return [
                2,
                {
                  success: true,
                  message: 'LogRocket session URL retrieved',
                  sessionURL: sessionURL,
                },
              ];
          }
        });
      });
    };
    return MonitoringController_1;
  })());
  __setFunctionName(_classThis, 'MonitoringController');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    _getHealth_decorators = [
      (0, common_1.Get)('health'),
      (0, swagger_1.ApiOperation)({
        summary: 'Check monitoring services health',
      }),
      (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Monitoring services status',
      }),
    ];
    _testError_decorators = [
      (0, common_1.Post)('test-error'),
      (0, swagger_1.ApiOperation)({
        summary: 'Test error tracking (Sentry + LogRocket)',
      }),
      (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Test error thrown',
      }),
    ];
    _testLog_decorators = [
      (0, common_1.Post)('test-log'),
      (0, swagger_1.ApiOperation)({ summary: 'Test logging (LogRocket)' }),
      (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Log message sent',
      }),
    ];
    _testTrack_decorators = [
      (0, common_1.Post)('test-track'),
      (0, swagger_1.ApiOperation)({
        summary: 'Test event tracking (LogRocket)',
      }),
      (0, swagger_1.ApiResponse)({ status: 200, description: 'Event tracked' }),
    ];
    _identifyUser_decorators = [
      (0, common_1.Post)('identify-user'),
      (0, swagger_1.ApiOperation)({
        summary: 'Test user identification (LogRocket + Sentry)',
      }),
      (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User identified',
      }),
    ];
    _getSessionUrl_decorators = [
      (0, common_1.Get)('session-url'),
      (0, swagger_1.ApiOperation)({ summary: 'Get LogRocket session URL' }),
      (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'LogRocket session URL',
      }),
    ];
    __esDecorate(
      _classThis,
      null,
      _getHealth_decorators,
      {
        kind: 'method',
        name: 'getHealth',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getHealth' in obj;
          },
          get: function (obj) {
            return obj.getHealth;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _testError_decorators,
      {
        kind: 'method',
        name: 'testError',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'testError' in obj;
          },
          get: function (obj) {
            return obj.testError;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _testLog_decorators,
      {
        kind: 'method',
        name: 'testLog',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'testLog' in obj;
          },
          get: function (obj) {
            return obj.testLog;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _testTrack_decorators,
      {
        kind: 'method',
        name: 'testTrack',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'testTrack' in obj;
          },
          get: function (obj) {
            return obj.testTrack;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _identifyUser_decorators,
      {
        kind: 'method',
        name: 'identifyUser',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'identifyUser' in obj;
          },
          get: function (obj) {
            return obj.identifyUser;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      _classThis,
      null,
      _getSessionUrl_decorators,
      {
        kind: 'method',
        name: 'getSessionUrl',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getSessionUrl' in obj;
          },
          get: function (obj) {
            return obj.getSessionUrl;
          },
        },
        metadata: _metadata,
      },
      null,
      _instanceExtraInitializers,
    );
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: 'class', name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    MonitoringController = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (MonitoringController = _classThis);
})();
exports.MonitoringController = MonitoringController;
