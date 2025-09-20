'use strict';
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
exports.AppController = void 0;
var common_1 = require('@nestjs/common');
var swagger_1 = require('@nestjs/swagger');
var public_decorator_1 = require('./presentation/decorators/public.decorator');
var AppController = (function () {
  var _classDecorators = [
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)(),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var _instanceExtraInitializers = [];
  var _getHello_decorators;
  var _getHealth_decorators;
  var _getDatabaseHealth_decorators;
  var _testError_decorators;
  var _testSentry_decorators;
  var AppController = (_classThis = (function () {
    function AppController_1(appService, sentryService, databaseService) {
      this.appService =
        (__runInitializers(this, _instanceExtraInitializers), appService);
      this.sentryService = sentryService;
      this.databaseService = databaseService;
    }
    AppController_1.prototype.getHello = function () {
      return this.appService.getHello();
    };
    AppController_1.prototype.getHealth = function () {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        services: {
          database: 'connected',
          redis: 'connected',
          sentry: !!process.env.SENTRY_DSN,
        },
      };
    };
    AppController_1.prototype.getDatabaseHealth = function () {
      return __awaiter(this, void 0, void 0, function () {
        var db,
          tablesQuery,
          result,
          tables,
          migrationTableExists,
          usersTableExists,
          userCount,
          countResult,
          error_1,
          error_2;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 6, , 7]);
              db = this.databaseService.getDb();
              if (!db) {
                return [
                  2,
                  {
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    database: {
                      connected: false,
                      error: 'Database connection not initialized',
                      tables: [],
                      migrationTableExists: false,
                      usersTableExists: false,
                      userCount: 0,
                      totalTables: 0,
                    },
                  },
                ];
              }
              tablesQuery =
                "\n        SELECT table_name\n        FROM information_schema.tables\n        WHERE table_schema = 'public'\n        AND table_type = 'BASE TABLE'\n        ORDER BY table_name;\n      ";
              return [4, db.execute(tablesQuery)];
            case 1:
              result = _a.sent();
              tables = result.rows.map(function (row) {
                return row.table_name;
              });
              migrationTableExists = tables.includes('__drizzle_migrations');
              usersTableExists = tables.includes('users');
              userCount = 0;
              if (!usersTableExists) return [3, 5];
              _a.label = 2;
            case 2:
              _a.trys.push([2, 4, , 5]);
              return [4, db.execute('SELECT COUNT(*) as count FROM users')];
            case 3:
              countResult = _a.sent();
              userCount = parseInt(countResult.rows[0].count);
              return [3, 5];
            case 4:
              error_1 = _a.sent();
              return [3, 5];
            case 5:
              return [
                2,
                {
                  status: 'ok',
                  timestamp: new Date().toISOString(),
                  database: {
                    connected: true,
                    tables: tables,
                    migrationTableExists: migrationTableExists,
                    usersTableExists: usersTableExists,
                    userCount: userCount,
                    totalTables: tables.length,
                  },
                },
              ];
            case 6:
              error_2 = _a.sent();
              return [
                2,
                {
                  status: 'error',
                  timestamp: new Date().toISOString(),
                  database: {
                    connected: false,
                    error: error_2.message,
                    tables: [],
                    migrationTableExists: false,
                    usersTableExists: false,
                    userCount: 0,
                    totalTables: 0,
                  },
                },
              ];
            case 7:
              return [2];
          }
        });
      });
    };
    AppController_1.prototype.testError = function () {
      this.sentryService.captureMessage('Test error endpoint called', 'info');
      throw new Error('This is a test error for Sentry');
    };
    AppController_1.prototype.testSentry = function () {
      this.sentryService.captureMessage('Test Sentry integration', 'info');
      return { message: 'Sentry test message sent' };
    };
    return AppController_1;
  })());
  __setFunctionName(_classThis, 'AppController');
  (function () {
    var _metadata =
      typeof Symbol === 'function' && Symbol.metadata
        ? Object.create(null)
        : void 0;
    _getHello_decorators = [
      (0, common_1.Get)(),
      (0, public_decorator_1.Public)(),
      (0, swagger_1.ApiOperation)({ summary: 'Get welcome message' }),
      (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Welcome message',
        schema: {
          type: 'string',
          example: 'Hello World!',
        },
      }),
    ];
    _getHealth_decorators = [
      (0, common_1.Get)('health'),
      (0, public_decorator_1.Public)(),
      (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
      (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Service health status',
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            uptime: { type: 'number', example: 123.456 },
            environment: { type: 'string', example: 'development' },
            version: { type: 'string', example: '1.0.0' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', example: 'connected' },
                redis: { type: 'string', example: 'connected' },
                sentry: { type: 'boolean', example: true },
              },
            },
          },
        },
      }),
    ];
    _getDatabaseHealth_decorators = [
      (0, common_1.Get)('health/database'),
      (0, public_decorator_1.Public)(),
      (0, swagger_1.ApiOperation)({
        summary: 'Database health and table status',
      }),
      (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Database status and table information',
      }),
    ];
    _testError_decorators = [
      (0, common_1.Post)('test-error'),
      (0, public_decorator_1.Public)(),
      (0, swagger_1.ApiOperation)({
        summary: 'Test error tracking (development only)',
      }),
      (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Test error thrown',
      }),
    ];
    _testSentry_decorators = [
      (0, common_1.Post)('test-sentry'),
      (0, public_decorator_1.Public)(),
      (0, swagger_1.ApiOperation)({
        summary: 'Test Sentry message capture (development only)',
      }),
      (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Sentry test message sent',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Sentry test message sent' },
          },
        },
      }),
    ];
    __esDecorate(
      _classThis,
      null,
      _getHello_decorators,
      {
        kind: 'method',
        name: 'getHello',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getHello' in obj;
          },
          get: function (obj) {
            return obj.getHello;
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
      _getDatabaseHealth_decorators,
      {
        kind: 'method',
        name: 'getDatabaseHealth',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'getDatabaseHealth' in obj;
          },
          get: function (obj) {
            return obj.getDatabaseHealth;
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
      _testSentry_decorators,
      {
        kind: 'method',
        name: 'testSentry',
        static: false,
        private: false,
        access: {
          has: function (obj) {
            return 'testSentry' in obj;
          },
          get: function (obj) {
            return obj.testSentry;
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
    AppController = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (AppController = _classThis);
})();
exports.AppController = AppController;
