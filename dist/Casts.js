"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Casts = exports.configureDateLib = void 0;
const moment_1 = __importDefault(require("moment"));
const luxon_1 = require("luxon");
let DATE_LIB = 'moment';
const SUPPORTED_DATE_LIBS = ['moment', 'luxon'];
function configureDateLib(dateLib) {
    if (!SUPPORTED_DATE_LIBS.includes(dateLib)) {
        throw new Error(`[mobx-spine] Unsupported date lib '${dateLib}'. Supported: ${SUPPORTED_DATE_LIBS.map((dateLib) => "'" + dateLib + "'").join(', ')}`);
    }
    DATE_LIB = dateLib;
}
exports.configureDateLib = configureDateLib;
function checkMomentInstance(attr, value) {
    if (!moment_1.default.isMoment(value)) {
        throw new Error(`[mobx-spine] Attribute '${attr}' is not a moment instance.`);
    }
}
function checkLuxonDateTime(attr, value) {
    if (!luxon_1.DateTime.isDateTime(value)) {
        throw new Error(`[mobx-spine] Attribute '${attr}' is not a luxon instance.`);
    }
}
const LUXON_DATE_FORMAT = 'yyyy-LL-dd';
const LUXON_DATETIME_FORMAT = "yyyy'-'LL'-'dd'T'HH':'mm':'ssZZ";
class CastsClass {
    constructor() {
        this.momentDate = {
            parse(_attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                return moment_1.default(value, 'YYYY-MM-DD');
            },
            toJS(attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                checkMomentInstance(attr, value);
                return value.format('YYYY-MM-DD');
            },
            dateLib: 'moment',
        };
        this.momentDatetime = {
            parse(_attr, value) {
                if (value === null) {
                    return null;
                }
                return moment_1.default(value);
            },
            toJS(attr, value) {
                if (value === null) {
                    return null;
                }
                checkMomentInstance(attr, value);
                return value.toJSON(); // Use ISO8601 notation, adjusted to UTC
            },
            dateLib: 'moment',
        };
        this.luxonDate = {
            parse(_attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                return luxon_1.DateTime.fromISO(value);
            },
            toJS(attr, value) {
                if (value === null || value === undefined) {
                    return null;
                }
                checkLuxonDateTime(attr, value);
                return value.toFormat(LUXON_DATE_FORMAT);
            },
            dateLib: 'luxon',
        };
        this.luxonDatetime = {
            parse(_attr, value) {
                if (value === null) {
                    return null;
                }
                return luxon_1.DateTime.fromISO(value);
            },
            toJS(attr, value) {
                if (value === null) {
                    return null;
                }
                checkLuxonDateTime(attr, value);
                return value.toFormat(LUXON_DATETIME_FORMAT);
            },
            dateLib: 'luxon',
        };
        this.date = {
            parse(...args) {
                return exports.Casts[`${DATE_LIB}Date`].parse(...args);
            },
            toJS(...args) {
                return exports.Casts[`${DATE_LIB}Date`].toJS(...args);
            },
            get dateLib() {
                return DATE_LIB;
            },
        };
        this.datetime = {
            parse(...args) {
                return exports.Casts[`${DATE_LIB}Datetime`].parse(...args);
            },
            toJS(...args) {
                return exports.Casts[`${DATE_LIB}Datetime`].toJS(...args);
            },
            get dateLib() {
                return DATE_LIB;
            },
        };
    }
    enum(expectedValues) {
        function checkExpectedValues(attr, value) {
            if (value === null) {
                return null;
            }
            else if (expectedValues.includes(value)) {
                return value;
            }
            else {
                throw new Error(`Value set to attribute '${attr}', ${JSON.stringify(value)}, is not one of the allowed enum: ${JSON.stringify(expectedValues)}`);
            }
        }
        return {
            parse: checkExpectedValues,
            toJS: checkExpectedValues,
        };
    }
    ;
}
/**
 * The `Cast`s provided by mobx-spine. See the documentation of `Cast` for more
 * information. Applications are free to create and use their own casts.
 */
exports.Casts = new CastsClass();
