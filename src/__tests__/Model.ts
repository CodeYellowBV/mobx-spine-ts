import {Animal, AnimalCircular, Breed, Kind, Location, Person} from "./fixtures/Animal";
import {Model, tsPatch} from "../Model";
import {observable} from "mobx";
// @ts-ignore
import animalKindBreedData from "./fixtures/animal-with-kind-breed.json";

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
    const animal = new Animal({id: 2});
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


test('isNew should be true for new model', () => {
    const animal = new Animal();
    expect(animal.isNew).toBe(true);
});


test('isNew should be false for existing model', () => {
    const animal = new Animal({id: 2});
    expect(animal.isNew).toBe(false);
});
test('Initialize two-level relation', () => {
    const animal = new Animal(null, {
        relations: ['kind.breed'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Kind);
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Breed);
});


test('Initialize three-level relation', () => {
    const animal = new Animal(null, {
        relations: ['kind.breed.location'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Kind);
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Breed);
    // @ts-ignore

    expect(animal.kind.breed.location).toBeInstanceOf(Location);
});


test('Initialize multiple relations', () => {
    const animal = new Animal(null, {
        relations: ['kind', 'owner'],
    });

    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Kind);
    // @ts-ignore
    expect(animal.owner).toBeInstanceOf(Person);
});
test('Initialize circular model', () => {
    const animal = new AnimalCircular(
        {
            id: 2,
            circular: {
                id: 3,
            },
        },
        {relations: ['circular']}
    );


    expect(animal.id).toBe(2);
    // @ts-ignore
    expect(animal.circular).toBeInstanceOf(AnimalCircular);
    // @ts-ignore
    expect(animal.circular.circular).toBeUndefined();
    // @ts-ignore
    expect(animal.circular.id).toBe(3);
});

test('Initialize multiple nested relations', () => {
    const animal = new Animal(null, {
        relations: ['kind.breed', 'kind.location'],
    });
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Breed);
    // @ts-ignore
    expect(animal.kind.location).toBeInstanceOf(Location);
});

test('Attributes list', () => {
    const animal = new Animal();
    expect(animal.__attributes).toEqual(['id', 'name']);
});

test('Non-object given to parse() should throw an error', () => {
    expect(() => {
        const animal = new Animal();
        // @ts-ignore
        return animal.parse(1);
    }).toThrow('Parameter supplied to `parse()` is not an object, got: 1');
});


test('Non existent relation should throw an error', () => {
    expect(() => {
        return new Animal(null, {
            relations: ['ponyfoo'],
        });
    }).toThrow('Specified relation "ponyfoo" does not exist on model.');
});

test('Parsing two-level relation (with repos)', () => {
    const animal = new Animal(null, {
        relations: ['kind.breed'],
    });
    animal.fromBackend({
        data: animalKindBreedData.data,
        repos: animalKindBreedData.with,
        relMapping: animalKindBreedData.with_mapping,
    });
    expect(animal.id).toBe(1);
    expect(animal.name).toBe('Woofer');
    // @ts-ignore
    expect(animal.kind.id).toBe(4);
    // @ts-ignore
    expect(animal.kind.name).toBe('Good Dog');
    // @ts-ignore
    expect(animal.kind.breed.id).toBe(3);
    // @ts-ignore
    expect(animal.kind.breed.name).toBe('Good Pupper');
});


