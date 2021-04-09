import {createRelationTree} from "../../Utils";

test('Empty relation tree', () => {
    const tree = createRelationTree([]);
    expect(tree).toStrictEqual({});
});


test('single relation tree', () => {
    const tree = createRelationTree(['foo']);
    expect(tree).toStrictEqual({'foo': {}});
});

test('multiple relation tree', () => {
    const tree = createRelationTree(['foo', 'bar']);
    expect(tree).toStrictEqual({'foo': {}, 'bar': {}});
});

test('multilevel relation tree', () => {
    const tree = createRelationTree(['foo.bar']);
    expect(tree).toStrictEqual({'foo': {'bar': {}}});
});