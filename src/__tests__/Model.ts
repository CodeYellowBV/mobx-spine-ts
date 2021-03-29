import {Animal} from "./fixtures/Animal";
import _ from 'lodash';

const spyWarn = jest.spyOn( console, 'warn' );


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