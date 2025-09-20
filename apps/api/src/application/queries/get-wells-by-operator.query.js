'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GetWellsByOperatorQuery = void 0;
var GetWellsByOperatorQuery = (function () {
  function GetWellsByOperatorQuery(operatorId, page, limit, filters) {
    if (page === void 0) {
      page = 1;
    }
    if (limit === void 0) {
      limit = 10;
    }
    this.operatorId = operatorId;
    this.page = page;
    this.limit = limit;
    this.filters = filters;
  }
  return GetWellsByOperatorQuery;
})();
exports.GetWellsByOperatorQuery = GetWellsByOperatorQuery;
