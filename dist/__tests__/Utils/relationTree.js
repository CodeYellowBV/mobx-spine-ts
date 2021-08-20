"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("../../Utils");
test('Empty relation tree', function () {
    var tree = Utils_1.createRelationTree([]);
    expect(tree).toStrictEqual({});
});
test('single relation tree', function () {
    var tree = Utils_1.createRelationTree(['foo']);
    expect(tree).toStrictEqual({ 'foo': {} });
});
test('multiple relation tree', function () {
    var tree = Utils_1.createRelationTree(['foo', 'bar']);
    expect(tree).toStrictEqual({ 'foo': {}, 'bar': {} });
});
test('multilevel relation tree', function () {
    var tree = Utils_1.createRelationTree(['foo.bar']);
    expect(tree).toStrictEqual({ 'foo': { 'bar': {} } });
});
