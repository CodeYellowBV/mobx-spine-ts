import moment from 'moment';
import { DateTime } from 'luxon';

/**
 * `Cast`s are used to automagically (de)serialize some properties of `Model`s. This is
 * mostly used for (date)(time) properties: the property values will always be a
 * JavaScript (date)(time) object (and thus have a lot of useful methods), but the values
 * will always be sent as string over the network.
 */
export interface Cast<T> {
    /**
     * Parses the given `value` and returns a JavaScript representation of it. The
     * `value` is typically received from the backend.
     * @param attr The name of the attribute whose value should be parsed
     * @param value The value to be parsed
     */
    parse(attr: string, value: string): T;

    /**
     * Serializes the given `value` and returns a string representation of it. This
     * string representation is typically sent to the backend.
     * @param attr The name of the attribute whose value should be serialized
     * @param value The value to be serialized
     */
    toJS(attr: string, value: T): string;

    // Casts are free to add extra properties
    [x: string]: any;
}

let DATE_LIB = 'moment';
const SUPPORTED_DATE_LIBS = ['moment', 'luxon'];

export function configureDateLib(dateLib) {
    if (!SUPPORTED_DATE_LIBS.includes(dateLib)) {
        throw new Error(
            `[mobx-spine] Unsupported date lib '${dateLib}'. Supported: ${
                SUPPORTED_DATE_LIBS.map((dateLib) => "'" + dateLib + "'").join(', ')
            }`
        );
    }
    DATE_LIB = dateLib;
}

function checkMomentInstance(attr, value) {
    if (!moment.isMoment(value)) {
        throw new Error(`[mobx-spine] Attribute '${attr}' is not a moment instance.`);
    }
}

function checkLuxonDateTime(attr, value) {
    if (!DateTime.isDateTime(value)) {
        throw new Error(`[mobx-spine] Attribute '${attr}' is not a luxon instance.`)
    }
}

const LUXON_DATE_FORMAT = 'yyyy-LL-dd';
const LUXON_DATETIME_FORMAT = "yyyy'-'LL'-'dd'T'HH':'mm':'ssZZ";

class CastsClass {
    momentDate: Cast<moment.Moment> = {
        parse(_attr, value) {
            if (value === null || value === undefined) {
                return null;
            }
            return moment(value, 'YYYY-MM-DD');
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

    momentDatetime: Cast<moment.Moment> = {
        parse(_attr, value) {
            if (value === null) {
                return null;
            }
            return moment(value);
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

    luxonDate: Cast<DateTime> = {
        parse(_attr, value) {
            if (value === null || value === undefined) {
                return null;
            }
            return DateTime.fromISO(value);
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

    luxonDatetime: Cast<DateTime> = {
        parse(_attr, value) {
            if (value === null) {
                return null;
            }

            return DateTime.fromISO(value);
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

    date: Cast<DateTime | moment.Moment> = {
        parse(...args) {
            return Casts[`${DATE_LIB}Date`].parse(...args);
        },
        toJS(...args) {
            return Casts[`${DATE_LIB}Date`].toJS(...args);
        },
        get dateLib() {
            return DATE_LIB;
        },
    };

    datetime: Cast<DateTime | moment.Moment> = {
        parse(...args) {
            return Casts[`${DATE_LIB}Datetime`].parse(...args);
        },
        toJS(...args) {
            return Casts[`${DATE_LIB}Datetime`].toJS(...args);
        },
        get dateLib() {
            return DATE_LIB;
        },
    };

    enum<T>(expectedValues: T[]): Cast<T> {
        function checkExpectedValues(attr: string, value: any): any {
            if (value === null) {
                return null;
            } else if (expectedValues.includes(value)) {
                return value;
            } else {
                throw new Error(
                    `Value set to attribute '${attr}', ${JSON.stringify(value)}, is not one of the allowed enum: ${JSON.stringify(expectedValues)}`
                );
            }
        }
        return {
            parse: checkExpectedValues,
            toJS: checkExpectedValues,
        };
    };
}

/**
 * The `Cast`s provided by mobx-spine. See the documentation of `Cast` for more
 * information. Applications are free to create and use their own casts.
 */
export const Casts: CastsClass = new CastsClass();
