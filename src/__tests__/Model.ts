import {Animal, Kind} from "./fixtures/Animal";
import _ from 'lodash';
import {Model, tsPatch} from "../Model";
import {observable} from "mobx";

const spyWarn = jest.spyOn(console, 'warn');


beforeEach(() => {

    spyWarn.mockReset();
});

test('Initialize model with valid data', () => {
    const animal = new Animal({
        id: 2,
        name: 'Monkey',
    });

    animal.parse({
        id: 2,
        name: "Monkey"
    })

    expect(animal.id).toBe(2);
    expect(animal.name).toBe('Monkey');
});

test('initiialize model with invalid data', () => {

    // @ts-ignore
    const animal = new Animal({nonExistentProperty: 'foo'});

    // @ts-ignore
    expect(animal.nonExistentProperty).toBeUndefined();
});

test('Initialize model without data', () => {
    const animal = new Animal(null);

    expect(animal.id).toBeNull();
    expect(animal.name).toBe('');
});

test('Chaining parse', () => {
    const animal = new Animal().parse({});

    expect(animal).toBeInstanceOf(Animal);
});

test('`cid` should be a unique value`', () => {
    const a1 = new Animal();
    const a2 = new Animal();

    expect(a1.cid).toMatch(/m\d+/);
    expect(a2.cid).toMatch(/m\d+/);

    expect(a1.cid).not.toMatch(a2.cid);
});

test('primaryKey defined as not static should throw error', () => {
    @tsPatch
    class Zebra extends Model<object> {
        // @ts-ignore
        primaryKey = 'blaat';
    }

    expect(() => {
        return new Zebra();
    }).toThrow('`primaryKey` should be a static property on the model.');
});

test('Unpatched model should throw error', () => {
    class Zebra extends Model<object> {
        // @ts-ignore
        primaryKey = 'blaat';
    }

    expect(() => {
        return new Zebra();
    }).toThrow('Model is not patched with @tsPatch');
})

test('property defined as both attribute and relation should throw error', () => {
    @tsPatch
    class Zebra extends Model<object> {
        @observable kind = '';

        relation() {
            return {kind: Kind};
        }
    }

    expect(() => {
        return new Zebra(null, {relations: ['kind']});
    }).toThrow(
        'Cannot define `kind` as both an attribute and a relation. You probably need to remove the attribute.'
    );
});

test('initialize() method should be called', () => {
    const initMock = jest.fn();

    @tsPatch
    class Zebra extends Model<object> {
        initialize() {
            initMock();
        }
    }

    new Zebra();
    expect(initMock.mock.calls.length).toBe(1);
});

test('URL should be correct without primary key', () => {
    const animal = new Animal();
    expect(animal.url).toBe('/api/animal/');
});

test('URL should be correct with primary key', () => {
    const animal = new Animal({ id: 2 });
    expect(animal.url).toBe('/api/animal/2/');
});

test('Relation should not be initialized by default', () => {
    const animal = new Animal();
    // @ts-ignore
    expect(animal.kind).toBeUndefined();
});

test('Initialize one-level relation', () => {
    const animal = new Animal(null, {
        relations: ['kind'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Kind);
});