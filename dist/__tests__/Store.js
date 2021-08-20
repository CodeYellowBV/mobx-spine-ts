"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
var __1 = require("../");
var Animal_1 = require("./fixtures/Animal");
var Customer_1 = require("./fixtures/Customer");
var animals_with_past_owners_json_1 = __importDefault(require("./fixtures/animals-with-past-owners.json"));
var animals_with_kind_breed_json_1 = __importDefault(require("./fixtures/animals-with-kind-breed.json"));
var persons_with_pets_no_id_list_json_1 = __importDefault(require("./fixtures/persons-with-pets-no-id-list.json"));
var customers_with_town_restaurants_json_1 = __importDefault(require("./fixtures/customers-with-town-restaurants.json"));
var customers_with_town_restaurants_unbalanced_json_1 = __importDefault(require("./fixtures/customers-with-town-restaurants-unbalanced.json"));
var towns_with_restaurants_and_customers_no_id_list_json_1 = __importDefault(require("./fixtures/towns-with-restaurants-and-customers-no-id-list.json"));
var customers_with_old_towns_json_1 = __importDefault(require("./fixtures/customers-with-old-towns.json"));
var animals_json_1 = __importDefault(require("./fixtures/animals.json"));
var _0_json_1 = __importDefault(require("./fixtures/pagination/0.json"));
var _1_json_1 = __importDefault(require("./fixtures/pagination/1.json"));
var _2_json_1 = __importDefault(require("./fixtures/pagination/2.json"));
var _3_json_1 = __importDefault(require("./fixtures/pagination/3.json"));
var _4_json_1 = __importDefault(require("./fixtures/pagination/4.json"));
var simpleData = [
    {
        id: 2,
        name: 'Monkey',
    },
    {
        id: 3,
        name: 'Boogie',
    },
    {
        id: 10,
        name: 'Jojo',
    },
];
test('Initialize store with valid data', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    expect(animalStore.length).toBe(3);
    expect(animalStore.models[0].id).toBe(2);
});
test('Chaining parse', function () {
    var animalStore = new Animal_1.AnimalStore().parse([]);
    expect(animalStore).toBeInstanceOf(Animal_1.AnimalStore);
});
var EmptyModel = /** @class */ (function (_super) {
    __extends(EmptyModel, _super);
    function EmptyModel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EmptyModel;
}(__1.Model));
test('initialize() method should be called', function () {
    var initMock = jest.fn();
    var Zebra = /** @class */ (function (_super) {
        __extends(Zebra, _super);
        function Zebra() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Zebra.prototype.initialize = function () {
            initMock();
        };
        return Zebra;
    }(__1.Store));
    new Zebra();
    expect(initMock.mock.calls.length).toBe(1);
});
test('at model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var model = animalStore.at(1);
    expect(model.id).toBe(3);
});
test('at model (negative)', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var model = animalStore.at(-1);
    expect(model.id).toBe(10);
});
test('at model (non existent index)', function () {
    var animalStore = new Animal_1.AnimalStore().parse(simpleData);
    expect(function () {
        return animalStore.at(3);
    }).toThrow('[mobx-spine] Index 3 is out of bounds (max 2).');
    expect(function () {
        return animalStore.at(4);
    }).toThrow('[mobx-spine] Index 4 is out of bounds (max 2).');
});
test('Model -> Model relation', function () {
    var animalStore = new Animal_1.AnimalStore({
        relations: ['kind.breed'],
    });
    animalStore.parse(simpleData);
    var animal = animalStore.at(0);
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Animal_1.Breed);
});
test('Store -> Store relation', function () {
    var customerStore = new Customer_1.CustomerStore({
        relations: ['oldTowns.restaurants'],
    });
    customerStore.fromBackend({
        data: customers_with_old_towns_json_1.default.data,
        repos: customers_with_old_towns_json_1.default.with,
        relMapping: customers_with_old_towns_json_1.default.with_mapping,
        reverseRelMapping: customers_with_old_towns_json_1.default['with_related_name_mapping'], // undefined!
    });
    // @ts-ignore
    expect(customerStore.at(0).oldTowns.map('id')).toEqual([1, 2]);
    expect(customerStore
        .at(0)
        // @ts-ignore
        .oldTowns.at(0)
        .restaurants.map('id')).toEqual([10, 20]);
});
test('get specific model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var model = animalStore.get(3);
    expect(model.id).toBe(3);
});
test('get specific model (loose)', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var model = animalStore.get('3');
    expect(model.id).toBe(3);
});
test('get array of specific models', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var models = animalStore.getByIds([2, '3']);
    expect(models.map(function (m) { return m.id; })).toEqual([2, 3]);
});
test('map models', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    expect(animalStore.map('id')).toEqual([2, 3, 10]);
});
test('sortBy models', function () {
    var animalStore = new Animal_1.AnimalStore().parse(simpleData);
    expect(animalStore.sortBy('name').map(function (m) { return m.name; })).toEqual([
        'Boogie',
        'Jojo',
        'Monkey',
    ]);
});
test('filter models', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var models = animalStore.filter(['id', 3]);
    expect(models.length).toBe(1);
});
test('find model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var animal = animalStore.find({ name: 'Jojo' });
    expect(animal.id).toBe(10);
});
test('each model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var ids = [];
    animalStore.each(function (model) {
        ids.push(model.id);
    });
    expect(ids).toEqual([2, 3, 10]);
});
test('forEach model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var ids = [];
    animalStore.forEach(function (model) {
        ids.push(model.id);
    });
    expect(ids).toEqual([2, 3, 10]);
});
test('remove one model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var model = animalStore.get(3);
    animalStore.remove(model);
    expect(animalStore.map('id')).toEqual([2, 10]);
});
test('remove multiple models', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    expect(animalStore.map('id')).toEqual([2, 3, 10]);
    var model1 = animalStore.get(3);
    var model2 = animalStore.get(10);
    animalStore.remove([model1, model2]);
    expect(animalStore.map('id')).toEqual([2]);
});
test('remove from model without id', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse([{ name: 'A' }, { name: 'B' }]);
    animalStore.at(1).delete();
    expect(animalStore.map('name')).toEqual(['A']);
});
test('remove one model by id', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    animalStore.removeById(3);
    expect(animalStore.map('id')).toEqual([2, 10]);
});
test('remove multiple models by id', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    animalStore.removeById([3, 10]);
    expect(animalStore.map('id')).toEqual([2]);
});
test('remove model by id with invalid number', function () {
    var animalStore = new Animal_1.AnimalStore();
    expect(function () {
        return animalStore.removeById(['q']);
    }).toThrow('[mobx-spine] Can\'t remove a model by id that is Not A Number: ["q"]');
});
test('add one model', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var model = animalStore.add({
        id: 20,
    });
    expect(animalStore.map('id')).toEqual([2, 3, 10, 20]);
    expect(model).toBeInstanceOf(Animal_1.Animal);
});
test('add multiple models', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var models = animalStore.add([
        {
            id: 20,
        },
        {
            id: 21,
        },
    ]);
    expect(animalStore.map('id')).toEqual([2, 3, 10, 20, 21]);
    expect(models).toBeInstanceOf(Array);
    expect(models[0]).toBeInstanceOf(Animal_1.Animal);
});
test('add multiple models with same id', function () {
    var animalStore = new Animal_1.AnimalStore();
    expect(function () {
        return animalStore.add([
            {
                id: 20,
            },
            {
                id: 20,
            },
        ]);
    }).toThrow('A model with the same id 20 already exists');
});
test('add one model with existing id', function () {
    var animalStore = new Animal_1.AnimalStore().parse(simpleData);
    expect(function () {
        return animalStore.add([
            {
                id: 3,
            },
        ]);
    }).toThrow('A model with the same id 3 already exists');
});
test('add multiple models without id', function () {
    var animalStore = new Animal_1.AnimalStore().parse(simpleData);
    animalStore.add([
        {
            name: 'King',
        },
        {
            name: 'Alfred',
        },
    ]);
    expect(animalStore.length).toBe(5);
});
test('clear models', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    expect(animalStore.length).toBe(3);
    animalStore.clear();
    expect(animalStore.length).toBe(0);
});
test('virtualStore with basic properties', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var virtual = animalStore.virtualStore({
        filter: function (m) { return m.name.includes('e'); },
    });
    expect(virtual.map('id')).toEqual([2, 3]);
    var newModel = animalStore.add({ id: 5, name: 'eeeee' });
    expect(virtual.map('id')).toEqual([2, 3, 5]);
    animalStore.remove(newModel);
    expect(virtual.map('id')).toEqual([2, 3]);
    animalStore.get(2).name = 'aaaaa';
    expect(virtual.map('id')).toEqual([3]);
    // Verify that if the original store is busy, the virtual store is busy
    // as well.
    animalStore.__pendingRequestCount = 1337;
    expect(virtual.__pendingRequestCount).toBe(1337);
});
test('virtualStore unsubscribe', function () {
    var animalStore = new Animal_1.AnimalStore().parse(simpleData);
    var virtual = animalStore.virtualStore({
        filter: function (m) { return m.name.includes('555'); },
    });
    virtual.unsubscribeVirtualStore();
    animalStore.add({ id: 5, name: '555' });
    // Verify that the virtualStore is not updated anymore.
    expect(virtual.map('id')).toEqual([]);
});
// This test is commented out because the mistake being tested is now a compile error
// test('backendResourceName defined as not static should throw error', () => {
//     class Zebra extends Store<EmptyModelData, EmptyModel> {
//         backendResourceName = 'blaat';
//     }
//     expect(() => {
//         return new Zebra();
//     }).toThrow(
//         '`backendResourceName` should be a static property on the store.'
//     );
// });
test('One-level store relation', function () {
    var animalStore = new Animal_1.AnimalStore({
        relations: ['pastOwners'],
    });
    animalStore.fromBackend({
        data: animals_with_past_owners_json_1.default.data,
        repos: animals_with_past_owners_json_1.default.with,
        relMapping: animals_with_past_owners_json_1.default.with_mapping,
        reverseRelMapping: persons_with_pets_no_id_list_json_1.default.with_related_name_mapping,
    });
    // @ts-ignore
    expect(animalStore.at(0).pastOwners).toBeInstanceOf(Animal_1.PersonStore);
    // @ts-ignore
    expect(animalStore.get(2).pastOwners.map('id')).toEqual([2, 3]);
    // @ts-ignore
    expect(animalStore.get(3).pastOwners.map('id')).toEqual([1]);
});
// This test is a test for Binder-style models where we didn't add an
// m2m_fields list, so the id list is missing from the response.
// However, there is a id mapping back from the related object to the
// main object.
test('One-level store relation without id list (using reverse mapping)', function () {
    var personStore = new Animal_1.PersonStore({
        relations: ['pets'],
    });
    personStore.fromBackend({
        data: persons_with_pets_no_id_list_json_1.default.data,
        repos: persons_with_pets_no_id_list_json_1.default.with,
        relMapping: persons_with_pets_no_id_list_json_1.default.with_mapping,
        reverseRelMapping: persons_with_pets_no_id_list_json_1.default.with_related_name_mapping,
    });
    // @ts-ignore
    expect(personStore.at(0).pets).toBeInstanceOf(Animal_1.AnimalStore); // Jon's pets:
    // @ts-ignore
    expect(personStore.get(1).pets.map('id')).toEqual([3, 4]); // Garfield and Odie
    // @ts-ignore
    expect(personStore.get(2).pets.map('id')).toEqual([]); // Bobbie has no pets
    // @ts-ignore
    expect(personStore.get(3).pets.map('id')).toEqual([2]); // Oessein's pet: "Cat"
});
test('Two-level store relation without id list (using reverse mapping)', function () {
    var locationStore = new Customer_1.LocationStore({
        relations: ['restaurants', 'restaurants.favouriteCustomers'],
    });
    locationStore.fromBackend({
        data: towns_with_restaurants_and_customers_no_id_list_json_1.default.data,
        repos: towns_with_restaurants_and_customers_no_id_list_json_1.default.with,
        relMapping: towns_with_restaurants_and_customers_no_id_list_json_1.default.with_mapping,
        reverseRelMapping: towns_with_restaurants_and_customers_no_id_list_json_1.default.with_related_name_mapping,
    });
    // @ts-ignore
    expect(locationStore.at(0).restaurants).toBeInstanceOf(Customer_1.RestaurantStore); // Restaurants in Hardinxveld
    // @ts-ignore
    expect(locationStore.get(1).restaurants.map('id')).toEqual([1, 2]); // Fastfood and Seafood
    // @ts-ignore
    expect(locationStore.get(2).restaurants.map('id')).toEqual([3, 4]); // Taco Bell and Five Guys
    // @ts-ignore
    expect(locationStore.get(3).restaurants.map('id')).toEqual([]); // Best has no Restaurants
    // @ts-ignore
    var fastfood = locationStore.get(1).restaurants.get(1);
    // @ts-ignore
    var seafood = locationStore.get(1).restaurants.get(2);
    // @ts-ignore
    var tacoBell = locationStore.get(2).restaurants.get(3);
    // @ts-ignore
    var fiveGuys = locationStore.get(2).restaurants.get(4);
    expect(fastfood.favouriteCustomers).toBeInstanceOf(Customer_1.CustomerStore);
    expect(fastfood.favouriteCustomers.map('id')).toEqual([2, 3]); // Piet and Ingrid
    expect(seafood.favouriteCustomers).toBeInstanceOf(Customer_1.CustomerStore);
    expect(seafood.favouriteCustomers.map('id')).toEqual([1]); // Henk
    expect(tacoBell.favouriteCustomers).toBeInstanceOf(Customer_1.CustomerStore);
    expect(tacoBell.favouriteCustomers.map('id')).toEqual([]); // Nobody likes to eat at Taco Bell
    expect(fiveGuys.favouriteCustomers).toBeInstanceOf(Customer_1.CustomerStore);
    expect(fiveGuys.favouriteCustomers.map('id')).toEqual([4, 5]); // Jos and Sandra
});
test('toJS', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse([{ id: 2, name: 'Monkey' }]);
    expect(animalStore.toJS()).toEqual([{ id: 2, name: 'Monkey' }]);
});
// This test is commented out because the error being tested is a compile error in TypeScript
// test('Non-array given to parse() should throw an error', () => {
//     expect(() => {
//         const animalStore = new AnimalStore();
//         return animalStore.parse(1);
//     }).toThrow('Parameter supplied to `parse()` is not an array, got: 1');
// });
test('fetch without api', function () {
    var animalStore = new Animal_1.AnimalStoreWithoutApi();
    expect(function () { return animalStore.fetch(); }).toThrow('[mobx-spine] You are trying to perform an API request without an `api` property defined on the store.');
});
test('fetch without url', function () {
    var animalStore = new Animal_1.AnimalStoreWithoutUrl();
    expect(function () { return animalStore.fetch(); }).toThrow('[mobx-spine] You are trying to perform an API request without a `url` property defined on the store.');
});
test('Comparator - manual sort on attribute', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    animalStore.comparator = 'name';
    animalStore.sort();
    expect(animalStore.map('name')).toEqual(['Boogie', 'Jojo', 'Monkey']);
});
test('Comparator - manual sort with function', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    animalStore.comparator = function (a, b) {
        return b.id - a.id;
    };
    animalStore.sort();
    expect(animalStore.map('id')).toEqual([10, 3, 2]);
});
test('Comparator - initial automatic sort', function () {
    var animalStore = new Animal_1.AnimalStore({ comparator: 'name' });
    animalStore.parse(simpleData);
    expect(animalStore.map('name')).toEqual(['Boogie', 'Jojo', 'Monkey']);
});
test('Comparator - after add', function () {
    var animalStore = new Animal_1.AnimalStore({ comparator: 'name' });
    animalStore.parse(simpleData);
    animalStore.add({ name: 'Cee' });
    expect(animalStore.map('name')).toEqual([
        'Boogie',
        'Cee',
        'Jojo',
        'Monkey',
    ]);
});
test('Sort with invalid parameter', function () {
    var animalStore = new Animal_1.AnimalStore();
    expect(function () { return animalStore.sort(function () { return null; }); }).toThrow('Expecting a plain object for options.');
});
test('virtualStore with comparator', function () {
    var animalStore = new Animal_1.AnimalStore();
    animalStore.parse(simpleData);
    var virtual = animalStore.virtualStore({
        comparator: 'name',
    });
    expect(virtual.map('name')).toEqual(['Boogie', 'Jojo', 'Monkey']);
});
test('allow options.params to be set', function () {
    var animalStore = new Animal_1.AnimalStore({ params: { foo: 'bar' } });
    expect(animalStore.params).toEqual({ foo: 'bar' });
});
test('clearing an empty store should not register a change', function () {
    var animalStore = new Animal_1.AnimalStore({ params: { foo: 'bar' } });
    expect(animalStore.hasSetChanges).toEqual(false);
    animalStore.clear();
    expect(animalStore.hasSetChanges).toEqual(false);
});
describe('requests', function () {
    var mock;
    beforeEach(function () {
        mock = new axios_mock_adapter_1.default(axios_1.default);
    });
    afterEach(function () {
        if (mock) {
            mock.restore();
            mock = null;
        }
    });
    test('fetch with basic properties', function () {
        var animalStore = new Animal_1.AnimalStore();
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/api/animal/');
            expect(config.method).toBe('get');
            expect(config.params).toEqual({
                with: null,
                limit: 25,
                offset: null,
            });
            return [200, animals_json_1.default];
        });
        return animalStore.fetch().then(function (response) {
            expect(animalStore.length).toBe(2);
            expect(animalStore.map('id')).toEqual([2, 3]);
            expect(response).toEqual(animals_json_1.default);
        });
    });
    test('fetch with custom buildFetchData', function () {
        var _a;
        var store = new (_a = /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.Model = EmptyModel;
                    _this.api = new __1.BinderApi();
                    return _this;
                }
                class_1.prototype.buildFetchData = function (options) {
                    return { custom: 'data' };
                };
                return class_1;
            }(__1.Store)),
            _a.backendResourceName = 'resource',
            _a)();
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                custom: 'data'
            });
            return [200, {
                    data: [],
                    meta: { total_records: 0 }
                }];
        });
        return store.fetch();
    });
    test('fetch with auto-generated URL', function () {
        var personStore = new Animal_1.PersonStoreResourceName();
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/person/');
            return [200, animals_json_1.default];
        });
        return personStore.fetch();
    });
    test('fetch with url as function', function () {
        var animalStore = new Animal_1.AnimalStoreWithUrlFunction();
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/api/animal/1/');
            return [200, animals_json_1.default];
        });
        return animalStore.fetch();
    });
    test('fetch with camelCased relations', function () {
        var animalStore = new Animal_1.AnimalStore({
            relations: ['pastOwners'],
        });
        mock.onAny().replyOnce(function (config) {
            expect(config.params.with).toBe('past_owners');
            return [200, animals_json_1.default];
        });
        return animalStore.fetch();
    });
    test('fetch with relations', function () {
        var animalStore = new Animal_1.AnimalStore({
            relations: ['kind.breed'],
        });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: 'kind.breed',
                limit: 25,
                offset: null,
            });
            return [200, animals_with_kind_breed_json_1.default];
        });
        return animalStore.fetch().then(function () {
            expect(animalStore.at(0).id).toBe(1);
            // @ts-ignore
            expect(animalStore.at(0).kind.id).toBe(4);
            // @ts-ignore
            expect(animalStore.at(0).kind.breed.id).toBe(3);
        });
    });
    test('fetch with complex nested relations', function () {
        var customerStore = new Customer_1.CustomerStore({
            relations: ['town.restaurants.chef'],
        });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: 'town.restaurants.chef',
                limit: 25,
                offset: null,
            });
            return [200, customers_with_town_restaurants_json_1.default];
        });
        return customerStore.fetch().then(function () {
            expect(customerStore.toJS()).toMatchSnapshot();
        });
    });
    test('fetch with unbalanced complex relations', function () {
        var customerStore = new Customer_1.CustomerStore({
            relations: ['town.restaurants.chef', 'town'],
        });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: 'town.restaurants.chef,town',
                limit: 25,
                offset: null,
            });
            return [200, customers_with_town_restaurants_unbalanced_json_1.default];
        });
        return customerStore.fetch().then(function () {
            expect(customerStore.toJS()).toMatchSnapshot();
        });
    });
    test('isLoading', function () {
        var animalStore = new Animal_1.AnimalStore();
        expect(animalStore.isLoading).toBe(false);
        mock.onAny().replyOnce(function () {
            expect(animalStore.isLoading).toBe(true);
            return [200, animals_json_1.default];
        });
        return animalStore.fetch().then(function () {
            expect(animalStore.isLoading).toBe(false);
        });
    });
    test('isLoading with failed request', function () {
        var animalStore = new Animal_1.AnimalStore();
        mock.onAny().replyOnce(function () {
            expect(animalStore.isLoading).toBe(true);
            return [404];
        });
        return animalStore.fetch().catch(function () {
            expect(animalStore.isLoading).toBe(false);
        });
    });
});
describe('Pagination', function () {
    var mock;
    beforeEach(function () {
        mock = new axios_mock_adapter_1.default(axios_1.default);
    });
    afterEach(function () {
        if (mock) {
            mock.restore();
            mock = null;
        }
    });
    test('without limit', function () {
        var animalStore = new Animal_1.AnimalStore({
            limit: null,
        });
        expect(animalStore.totalPages).toBe(0);
    });
    // This test is commented out because the error being tested is now a compile error
    // test('set invalid limit', () => {
    //     const animalStore = new AnimalStore();
    //     expect(() => animalStore.setLimit('a')).toThrow(
    //         'Page limit should be a number or falsy value.'
    //     );
    //     expect(animalStore.totalPages).toBe(0);
    // });
    test('with four pages on first page', function () {
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: null,
                limit: 3,
                offset: null,
            });
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        expect(animalStore.totalPages).toBe(0);
        expect(animalStore.currentPage).toBe(1);
        expect(animalStore.hasNextPage).toBe(false);
        expect(animalStore.hasPreviousPage).toBe(false);
        return animalStore.fetch().then(function () {
            expect(animalStore.totalPages).toBe(4);
            expect(animalStore.currentPage).toBe(1);
            expect(animalStore.hasNextPage).toBe(true);
            expect(animalStore.hasPreviousPage).toBe(false);
        });
    });
    test('getNextPage - with four pages to second page', function () {
        mock.onAny().replyOnce(function () {
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        return animalStore
            .fetch()
            .then(function () {
            mock.onAny().replyOnce(function (config) {
                expect(config.params).toEqual({
                    with: null,
                    limit: 3,
                    offset: 3,
                });
                return [200, _2_json_1.default];
            });
            return animalStore.getNextPage();
        })
            .then(function () {
            expect(animalStore.map('id')).toEqual([4, 5, 6]);
            expect(animalStore.currentPage).toBe(2);
            expect(animalStore.hasPreviousPage).toBe(true);
            expect(animalStore.hasNextPage).toBe(true);
        });
    });
    test('getNextPage - with four pages to fourth page', function () {
        mock.onAny().replyOnce(function () {
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        return animalStore
            .fetch()
            .then(function () {
            mock.onAny().replyOnce(function () {
                return [200, _2_json_1.default];
            });
            return animalStore.getNextPage();
        })
            .then(function () {
            mock.onAny().replyOnce(function () {
                return [200, _3_json_1.default];
            });
            return animalStore.getNextPage();
        })
            .then(function () {
            mock.onAny().replyOnce(function () {
                return [200, _4_json_1.default];
            });
            return animalStore.getNextPage();
        })
            .then(function () {
            expect(animalStore.currentPage).toBe(4);
            expect(animalStore.hasPreviousPage).toBe(true);
            expect(animalStore.hasNextPage).toBe(false);
        });
    });
    test('getPreviousPage', function () {
        mock.onAny().replyOnce(function () {
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        return animalStore
            .fetch()
            .then(function () {
            mock.onAny().replyOnce(function () {
                return [200, _2_json_1.default];
            });
            return animalStore.getNextPage();
        })
            .then(function () {
            mock.onAny().replyOnce(function () {
                return [200, _1_json_1.default];
            });
            return animalStore.getPreviousPage();
        })
            .then(function () {
            expect(animalStore.map('id')).toEqual([1, 2, 3]);
            expect(animalStore.currentPage).toBe(1);
            expect(animalStore.hasPreviousPage).toBe(false);
        });
    });
    test('getPreviousPage - without page', function () {
        var animalStore = new Animal_1.AnimalStore();
        expect(function () { return animalStore.getPreviousPage(); }).toThrow('[mobx-spine] There is no previous page');
    });
    test('getNextPage - without page', function () {
        var animalStore = new Animal_1.AnimalStore();
        expect(function () { return animalStore.getNextPage(); }).toThrow('[mobx-spine] There is no next page');
    });
    test('setPage with fetch', function () {
        mock.onAny().replyOnce(function () {
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        return animalStore
            .fetch()
            .then(function () {
            mock.onAny().replyOnce(function () {
                return [200, _3_json_1.default];
            });
            return animalStore.setPage(3);
        })
            .then(function () {
            expect(animalStore.map('id')).toEqual([7, 8, 9]);
            expect(animalStore.currentPage).toBe(3);
            expect(animalStore.hasPreviousPage).toBe(true);
            expect(animalStore.hasNextPage).toBe(true);
        });
    });
    test('setPage with invalid page', function () {
        var animalStore = new Animal_1.AnimalStore();
        expect(function () { return animalStore.setPage(-1); }).toThrow('Page (-1) should be greater than 0');
    });
    test('setPage with zero number', function () {
        var animalStore = new Animal_1.AnimalStore();
        expect(function () { return animalStore.setPage(0); }).toThrow('[mobx-spine] Page (0) should be greater than 0');
    });
    test('setPage with not existent page', function () {
        mock.onAny().replyOnce(function () {
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        return animalStore.fetch().then(function () {
            expect(function () { return animalStore.setPage(5, { fetch: false }); }).toThrow('[mobx-spine] Page (5) should be between 1 and 4');
        });
    });
    test('setPage to 1 with no results', function () {
        mock.onAny().replyOnce(function () {
            return [200, _0_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore();
        return animalStore.fetch().then(function () {
            expect(animalStore.length).toBe(0);
            animalStore.setPage(1, { fetch: false });
            expect(animalStore.currentPage).toBe(1);
        });
    });
    test('setPage without fetch', function () {
        mock.onAny().replyOnce(function () {
            return [200, _1_json_1.default];
        });
        var animalStore = new Animal_1.AnimalStore({
            limit: 3,
        });
        return animalStore
            .fetch()
            .then(function () {
            return animalStore.setPage(3, { fetch: false });
        })
            .then(function () {
            expect(animalStore.map('id')).toEqual([1, 2, 3]);
        });
    });
});
