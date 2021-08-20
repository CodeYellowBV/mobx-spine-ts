"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Casts = exports.configureDateLib = void 0;
var moment_1 = __importDefault(require("moment"));
var luxon_1 = require("luxon");
var DATE_LIB = 'moment';
var SUPPORTED_DATE_LIBS = ['moment', 'luxon'];
function configureDateLib(dateLib) {
    if (!SUPPORTED_DATE_LIBS.includes(dateLib)) {
        throw new Error("[mobx-spine] Unsupported date lib '" + dateLib + "'. Supported: " + SUPPORTED_DATE_LIBS.map(function (dateLib) { return "'" + dateLib + "'"; }).join(', '));
    }
    DATE_LIB = dateLib;
}
exports.configureDateLib = configureDateLib;
function checkMomentInstance(attr, value) {
    if (!moment_1.default.isMoment(value)) {
        throw new Error("[mobx-spine] Attribute '" + attr + "' is not a moment instance.");
    }
}
function checkLuxonDateTime(attr, value) {
    if (!luxon_1.DateTime.isDateTime(value)) {
        throw new Error("[mobx-spine] Attribute '" + attr + "' is not a luxon instance.");
    }
}
var LUXON_DATE_FORMAT = 'yyyy-LL-dd';
var LUXON_DATETIME_FORMAT = "yyyy'-'LL'-'dd'T'HH':'mm':'ssZZ";
var CastsClass = /** @class */ (function () {
    function CastsClass() {
        this.momentDate = {
            parse: function (_attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                return moment_1.default(value, 'YYYY-MM-DD');
            },
            toJS: function (attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                checkMomentInstance(attr, value);
                return value.format('YYYY-MM-DD');
            },
            dateLib: 'moment',
        };
        this.momentDatetime = {
            parse: function (_attr, value) {
                if (value === null) {
                    return null;
                }
                return moment_1.default(value);
            },
            toJS: function (attr, value) {
                if (value === null) {
                    return null;
                }
                checkMomentInstance(attr, value);
                return value.toJSON(); // Use ISO8601 notation, adjusted to UTC
            },
            dateLib: 'moment',
        };
        this.luxonDate = {
            parse: function (_attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                return luxon_1.DateTime.fromISO(value);
            },
            toJS: function (attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                checkLuxonDateTime(attr, value);
                return value.toFormat(LUXON_DATE_FORMAT);
            },
            dateLib: 'luxon',
        };
        this.luxonDatetime = {
            parse: function (_attr, value) {
                if (value === null) {
                    return null;
                }
                return luxon_1.DateTime.fromISO(value);
            },
            toJS: function (attr, value) {
                if (value === null) {
                    return null;
                }
                checkLuxonDateTime(attr, value);
                return value.toFormat(LUXON_DATETIME_FORMAT);
            },
            dateLib: 'luxon',
        };
        this.date = {
            parse: function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return (_a = exports.Casts[DATE_LIB + "Date"]).parse.apply(_a, args);
            },
            toJS: function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return (_a = exports.Casts[DATE_LIB + "Date"]).toJS.apply(_a, args);
            },
            get dateLib() {
                return DATE_LIB;
            },
        };
        this.datetime = {
            parse: function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return (_a = exports.Casts[DATE_LIB + "Datetime"]).parse.apply(_a, args);
            },
            toJS: function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return (_a = exports.Casts[DATE_LIB + "Datetime"]).toJS.apply(_a, args);
            },
            get dateLib() {
                return DATE_LIB;
            },
        };
    }
    CastsClass.prototype.enum = function (expectedValues) {
        function checkExpectedValues(attr, value) {
            if (value === null) {
                return null;
            }
            else if (expectedValues.includes(value)) {
                return value;
            }
            else {
                throw new Error("Value set to attribute '" + attr + "', " + JSON.stringify(value) + ", is not one of the allowed enum: " + JSON.stringify(expectedValues));
            }
        }
        return {
            parse: checkExpectedValues,
            toJS: checkExpectedValues,
        };
    };
    ;
    return CastsClass;
}());
/**
 * The `Cast`s provided by mobx-spine. See the documentation of `Cast` for more
 * information. Applications are free to create and use their own casts.
 */
exports.Casts = new CastsClass();
