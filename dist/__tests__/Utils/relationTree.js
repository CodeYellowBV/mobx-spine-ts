"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../../Utils");
test('Empty relation tree', () => {
    const tree = Utils_1.createRelationTree([]);
    expect(tree).toStrictEqual({});
});
test('single relation tree', () => {
    const tree = Utils_1.createRelationTree(['foo']);
    expect(tree).toStrictEqual({ 'foo': {} });
});
test('multiple relation tree', () => {
    const tree = Utils_1.createRelationTree(['foo', 'bar']);
    expect(tree).toStrictEqual({ 'foo': {}, 'bar': {} });
});
test('multilevel relation tree', () => {
    const tree = Utils_1.createRelationTree(['foo.bar']);
    expect(tree).toStrictEqual({ 'foo': { 'bar': {} } });
});
