/**
 * Takes an object and changes all negative numbers to be a check for a negative number so that you can check if two
 * objects are the same except for the generated negative ids which can be different.
 *
 * @param expected
 */
export declare function modifyObjectNegativeIdCheck(object: Object): void;
/**
 * Checks if 2 objects are the same ignoring negative ids
 * @param object    The first object you want to compare
 * @param toEqual   The second object you want to compare the first object to
 * @param expect    The expect of the test to do the actual comparison
 * @param bool      True if the objects should be the same, false otherwise (default: true)
 */
export declare function compareObjectsIgnoringNegativeIds(object: Object, toEqual: Object, expect: Function, bool?: boolean): void;
