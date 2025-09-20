'use strict';
var __makeTemplateObject =
  (this && this.__makeTemplateObject) ||
  function (cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, 'raw', { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
  };
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
exports.WellRepositoryImpl = void 0;
var common_1 = require('@nestjs/common');
var drizzle_orm_1 = require('drizzle-orm');
var well_entity_1 = require('../../domain/entities/well.entity');
var location_1 = require('../../domain/value-objects/location');
var coordinates_1 = require('../../domain/value-objects/coordinates');
var well_schema_1 = require('../database/schemas/well.schema');
var WellRepositoryImpl = (function () {
  var _classDecorators = [(0, common_1.Injectable)()];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var WellRepositoryImpl = (_classThis = (function () {
    function WellRepositoryImpl_1(db) {
      this.db = db;
    }
    WellRepositoryImpl_1.prototype.save = function (well) {
      return __awaiter(this, void 0, void 0, function () {
        var wellData, existing;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              wellData = {
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
                updatedAt: well.getUpdatedAt(),
                version: well.getVersion(),
              };
              return [
                4,
                this.db
                  .select({ id: well_schema_1.wells.id })
                  .from(well_schema_1.wells)
                  .where(
                    (0, drizzle_orm_1.eq)(well_schema_1.wells.id, well.getId()),
                  )
                  .limit(1),
              ];
            case 1:
              existing = _a.sent();
              if (!(existing.length > 0)) return [3, 3];
              return [
                4,
                this.db
                  .update(well_schema_1.wells)
                  .set(wellData)
                  .where(
                    (0, drizzle_orm_1.eq)(well_schema_1.wells.id, well.getId()),
                  ),
              ];
            case 2:
              _a.sent();
              return [3, 5];
            case 3:
              return [
                4,
                this.db
                  .insert(well_schema_1.wells)
                  .values(
                    __assign(__assign({}, wellData), {
                      createdAt: well.getCreatedAt(),
                    }),
                  ),
              ];
            case 4:
              _a.sent();
              _a.label = 5;
            case 5:
              return [2];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.findById = function (id) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .select()
                  .from(well_schema_1.wells)
                  .where((0, drizzle_orm_1.eq)(well_schema_1.wells.id, id))
                  .limit(1),
              ];
            case 1:
              result = _a.sent();
              if (result.length === 0) {
                return [2, null];
              }
              return [2, this.mapToEntity(result[0])];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.findByApiNumber = function (apiNumber) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .select()
                  .from(well_schema_1.wells)
                  .where(
                    (0, drizzle_orm_1.eq)(
                      well_schema_1.wells.apiNumber,
                      apiNumber.getValue(),
                    ),
                  )
                  .limit(1),
              ];
            case 1:
              result = _a.sent();
              if (result.length === 0) {
                return [2, null];
              }
              return [2, this.mapToEntity(result[0])];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.findByOperatorId = function (operatorId) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .select()
                  .from(well_schema_1.wells)
                  .where(
                    (0, drizzle_orm_1.eq)(
                      well_schema_1.wells.operatorId,
                      operatorId,
                    ),
                  ),
              ];
            case 1:
              result = _a.sent();
              return [
                2,
                result.map(function (row) {
                  return _this.mapToEntity(row);
                }),
              ];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.findByLeaseId = function (leaseId) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .select()
                  .from(well_schema_1.wells)
                  .where(
                    (0, drizzle_orm_1.eq)(well_schema_1.wells.leaseId, leaseId),
                  ),
              ];
            case 1:
              result = _a.sent();
              return [
                2,
                result.map(function (row) {
                  return _this.mapToEntity(row);
                }),
              ];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.findByLocation = function (
      centerLat,
      centerLng,
      radiusKm,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        var _this = this;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .select()
                  .from(well_schema_1.wells)
                  .where(
                    (0, drizzle_orm_1.sql)(
                      templateObject_1 ||
                        (templateObject_1 = __makeTemplateObject(
                          [
                            '\n          (6371 * acos(\n            cos(radians(',
                            ")) * \n            cos(radians((location->>'coordinates')::json->>'latitude')::float) * \n            cos(radians((location->>'coordinates')::json->>'longitude')::float) - radians(",
                            ')) + \n            sin(radians(',
                            ")) * \n            sin(radians((location->>'coordinates')::json->>'latitude')::float)\n          )) <= ",
                            '\n        ',
                          ],
                          [
                            '\n          (6371 * acos(\n            cos(radians(',
                            ")) * \n            cos(radians((location->>'coordinates')::json->>'latitude')::float) * \n            cos(radians((location->>'coordinates')::json->>'longitude')::float) - radians(",
                            ')) + \n            sin(radians(',
                            ")) * \n            sin(radians((location->>'coordinates')::json->>'latitude')::float)\n          )) <= ",
                            '\n        ',
                          ],
                        )),
                      centerLat,
                      centerLng,
                      centerLat,
                      radiusKm,
                    ),
                  ),
              ];
            case 1:
              result = _a.sent();
              return [
                2,
                result.map(function (row) {
                  return _this.mapToEntity(row);
                }),
              ];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.findWithPagination = function (
      offset,
      limit,
      filters,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var conditions,
          whereClause,
          wellsQuery,
          countQuery,
          _a,
          wellsResult,
          totalResult;
        var _this = this;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              conditions = [];
              if (
                filters === null || filters === void 0
                  ? void 0
                  : filters.operatorId
              ) {
                conditions.push(
                  (0, drizzle_orm_1.eq)(
                    well_schema_1.wells.operatorId,
                    filters.operatorId,
                  ),
                );
              }
              if (
                filters === null || filters === void 0 ? void 0 : filters.status
              ) {
                conditions.push(
                  (0, drizzle_orm_1.eq)(
                    well_schema_1.wells.status,
                    filters.status,
                  ),
                );
              }
              if (
                filters === null || filters === void 0
                  ? void 0
                  : filters.wellType
              ) {
                conditions.push(
                  (0, drizzle_orm_1.eq)(
                    well_schema_1.wells.wellType,
                    filters.wellType,
                  ),
                );
              }
              whereClause =
                conditions.length === 0
                  ? undefined
                  : conditions.length === 1
                    ? conditions[0]
                    : drizzle_orm_1.and.apply(void 0, conditions);
              wellsQuery = whereClause
                ? this.db
                    .select()
                    .from(well_schema_1.wells)
                    .where(whereClause)
                    .offset(offset)
                    .limit(limit)
                : this.db
                    .select()
                    .from(well_schema_1.wells)
                    .offset(offset)
                    .limit(limit);
              countQuery = whereClause
                ? this.db
                    .select({ count: (0, drizzle_orm_1.count)() })
                    .from(well_schema_1.wells)
                    .where(whereClause)
                : this.db
                    .select({ count: (0, drizzle_orm_1.count)() })
                    .from(well_schema_1.wells);
              return [4, Promise.all([wellsQuery, countQuery])];
            case 1:
              ((_a = _b.sent()), (wellsResult = _a[0]), (totalResult = _a[1]));
              return [
                2,
                {
                  wells: wellsResult.map(function (row) {
                    return _this.mapToEntity(row);
                  }),
                  total: totalResult[0].count,
                },
              ];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.delete = function (id) {
      return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .delete(well_schema_1.wells)
                  .where((0, drizzle_orm_1.eq)(well_schema_1.wells.id, id)),
              ];
            case 1:
              _a.sent();
              return [2];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.existsByApiNumber = function (apiNumber) {
      return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [
                4,
                this.db
                  .select({ id: well_schema_1.wells.id })
                  .from(well_schema_1.wells)
                  .where(
                    (0, drizzle_orm_1.eq)(
                      well_schema_1.wells.apiNumber,
                      apiNumber.getValue(),
                    ),
                  )
                  .limit(1),
              ];
            case 1:
              result = _a.sent();
              return [2, result.length > 0];
          }
        });
      });
    };
    WellRepositoryImpl_1.prototype.mapToEntity = function (row) {
      var locationData = row.location;
      var coordinates = new coordinates_1.Coordinates(
        locationData.coordinates.latitude,
        locationData.coordinates.longitude,
      );
      var location = new location_1.Location(coordinates, {
        address: locationData.address,
        county: locationData.county,
        state: locationData.state,
        country: locationData.country,
      });
      return well_entity_1.Well.fromPersistence({
        id: row.id,
        apiNumber: row.apiNumber,
        name: row.name,
        operatorId: row.operatorId,
        leaseId: row.leaseId,
        wellType: row.wellType,
        status: row.status,
        location: locationData,
        spudDate: row.spudDate,
        completionDate: row.completionDate,
        totalDepth: row.totalDepth,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        version: row.version,
      });
    };
    return WellRepositoryImpl_1;
  })());
  __setFunctionName(_classThis, 'WellRepositoryImpl');
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
    WellRepositoryImpl = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (WellRepositoryImpl = _classThis);
})();
exports.WellRepositoryImpl = WellRepositoryImpl;
var templateObject_1;
