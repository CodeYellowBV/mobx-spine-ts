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
    [x: string]: any;
}
export declare function configureDateLib(dateLib: any): void;
declare class CastsClass {
    momentDate: Cast<moment.Moment>;
    momentDatetime: Cast<moment.Moment>;
    luxonDate: Cast<DateTime>;
    luxonDatetime: Cast<DateTime>;
    date: Cast<DateTime | moment.Moment>;
    datetime: Cast<DateTime | moment.Moment>;
    enum<T>(expectedValues: T[]): Cast<T>;
}
/**
 * The `Cast`s provided by mobx-spine. See the documentation of `Cast` for more
 * information. Applications are free to create and use their own casts.
 */
export declare const Casts: CastsClass;
export {};
