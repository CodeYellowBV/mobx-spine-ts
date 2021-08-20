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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Animal_1 = require("./fixtures/Animal");
var lodash_1 = __importDefault(require("lodash"));
var Customer_1 = require("./fixtures/Customer");
var Model_1 = require("../Model");
var BinderApi_1 = require("../BinderApi");
var mobx_1 = require("mobx");
var axios_1 = __importDefault(require("axios"));
var axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
var save_fail_json_1 = __importDefault(require("./fixtures/save-fail.json"));
var save_new_fail_json_1 = __importDefault(require("./fixtures/save-new-fail.json"));
var animals_multi_put_error_json_1 = __importDefault(require("./fixtures/animals-multi-put-error.json"));
var animals_multi_put_response_json_1 = __importDefault(require("./fixtures/animals-multi-put-response.json"));
var animal_with_kind_breed_json_1 = __importDefault(require("./fixtures/animal-with-kind-breed.json"));
var customers_location_best_cook_work_places_json_1 = __importDefault(require("./fixtures/customers-location-best-cook-work-places.json"));
var animal_with_kind_breed_nested_json_1 = __importDefault(require("./fixtures/animal-with-kind-breed-nested.json"));
var animals_with_past_owners_and_town_json_1 = __importDefault(require("./fixtures/animals-with-past-owners-and-town.json"));
var customers_with_town_cook_restaurant_json_1 = __importDefault(require("./fixtures/customers-with-town-cook-restaurant.json"));
beforeEach(function () {
    // Refresh lodash's `_.uniqueId` internal state for every test
    var idCounter = 0;
    lodash_1.default.uniqueId = jest.fn(function (prefix) {
        idCounter += 1;
        return prefix + idCounter;
    });
});
var spyWarn = jest.spyOn(console, 'warn');
beforeEach(function () {
    spyWarn.mockReset();
});
test('Initialize model with valid data', function () {
    var animal = new Animal_1.Animal({
        id: 2,
        name: 'Monkey',
    });
    animal.parse({
        id: 2,
        name: "Monkey"
    });
    expect(animal.id).toBe(2);
    expect(animal.name).toBe('Monkey');
});
test('initiialize model with invalid data', function () {
    // @ts-ignore
    var animal = new Animal_1.Animal({ nonExistentProperty: 'foo' });
    // @ts-ignore
    expect(animal.nonExistentProperty).toBeUndefined();
});
test('Initialize model without data', function () {
    var animal = new Animal_1.Animal(null);
    expect(animal.id).toBeNull();
    expect(animal.name).toBe('');
});
test('Chaining parse', function () {
    var animal = new Animal_1.Animal().parse({});
    expect(animal).toBeInstanceOf(Animal_1.Animal);
});
test('`cid` should be a unique value`', function () {
    var a1 = new Animal_1.Animal();
    var a2 = new Animal_1.Animal();
    expect(a1.cid).toMatch(/m\d+/);
    expect(a2.cid).toMatch(/m\d+/);
    expect(a1.cid).not.toMatch(a2.cid);
});
test('Unpatched model should throw error', function () {
    var Zebra = /** @class */ (function (_super) {
        __extends(Zebra, _super);
        function Zebra() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Zebra;
    }(Model_1.Model));
    expect(function () {
        return new Zebra();
    }).toThrow('Model is not patched with @tsPatch');
});
test('property defined as both attribute and relation should throw error', function () {
    var Zebra = /** @class */ (function (_super) {
        __extends(Zebra, _super);
        function Zebra() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.kind = '';
            return _this;
        }
        Zebra.prototype.relation = function () {
            return { kind: Animal_1.Kind };
        };
        __decorate([
            mobx_1.observable
        ], Zebra.prototype, "kind", void 0);
        Zebra = __decorate([
            Model_1.tsPatch
        ], Zebra);
        return Zebra;
    }(Model_1.Model));
    expect(function () {
        return new Zebra(null, { relations: ['kind'] });
    }).toThrow('Cannot define `kind` as both an attribute and a relation. You probably need to remove the attribute.');
});
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
        Zebra = __decorate([
            Model_1.tsPatch
        ], Zebra);
        return Zebra;
    }(Model_1.Model));
    new Zebra();
    expect(initMock.mock.calls.length).toBe(1);
});
test('URL should be correct without primary key', function () {
    var animal = new Animal_1.Animal();
    expect(animal.url).toBe('/api/animal/');
});
test('URL should be correct with primary key', function () {
    var animal = new Animal_1.Animal({ id: 2 });
    expect(animal.url).toBe('/api/animal/2/');
});
test('Relation should not be initialized by default', function () {
    var animal = new Animal_1.Animal();
    // @ts-ignore
    expect(animal.kind).toBeUndefined();
});
test('Initialize one-level relation', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Animal_1.Kind);
});
test('isNew should be true for new model', function () {
    var animal = new Animal_1.Animal();
    expect(animal.isNew).toBe(true);
});
test('isNew should be false for existing model', function () {
    var animal = new Animal_1.Animal({ id: 2 });
    expect(animal.isNew).toBe(false);
});
test('Initialize two-level relation', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind.breed'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Animal_1.Kind);
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Animal_1.Breed);
});
test('Clear relation upon receiving null as its value', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['owner.pets']
    });
    animal.fromBackend({
        data: {
            id: 1,
            name: 'Barrie',
            // @ts-ignore
            owner: null
        }
    });
    // @ts-ignore
    expect(animal.owner.pets.models).toHaveLength(0);
});
test('Initialize three-level relation', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind.breed.location'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Animal_1.Kind);
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Animal_1.Breed);
    // @ts-ignore
    expect(animal.kind.breed.location).toBeInstanceOf(Animal_1.Location);
});
test('Initialize multiple relations', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind', 'owner'],
    });
    // @ts-ignore
    expect(animal.kind).toBeInstanceOf(Animal_1.Kind);
    // @ts-ignore
    expect(animal.owner).toBeInstanceOf(Animal_1.Person);
});
test('Initialize circular model', function () {
    var animal = new Animal_1.AnimalCircular({
        id: 2,
        circular: {
            id: 3,
        },
    }, { relations: ['circular'] });
    expect(animal.id).toBe(2);
    // @ts-ignore
    expect(animal.circular).toBeInstanceOf(Animal_1.AnimalCircular);
    // @ts-ignore
    expect(animal.circular.circular).toBeUndefined();
    // @ts-ignore
    expect(animal.circular.id).toBe(3);
});
test('Initialize multiple nested relations', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind.breed', 'kind.location'],
    });
    // @ts-ignore
    expect(animal.kind.breed).toBeInstanceOf(Animal_1.Breed);
    // @ts-ignore
    expect(animal.kind.location).toBeInstanceOf(Animal_1.Location);
});
test('Attributes list', function () {
    var animal = new Animal_1.Animal();
    expect(animal.__attributes).toEqual(['id', 'name']);
});
test('Non-object given to parse() should throw an error', function () {
    expect(function () {
        var animal = new Animal_1.Animal();
        // @ts-ignore
        return animal.parse(1);
    }).toThrow('Parameter supplied to `parse()` is not an object, got: 1');
});
test('Non existent relation should throw an error', function () {
    expect(function () {
        return new Animal_1.Animal(null, {
            relations: ['ponyfoo'],
        });
    }).toThrow('Specified relation "ponyfoo" does not exist on model.');
});
test('Parsing two-level relation (with repos)', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind.breed'],
    });
    animal.fromBackend({
        data: animal_with_kind_breed_json_1.default.data,
        repos: animal_with_kind_breed_json_1.default.with,
        relMapping: animal_with_kind_breed_json_1.default.with_mapping,
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
test('Parsing two-level relation (direct api response)', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind.breed'],
    });
    animal.fromBackend(animal_with_kind_breed_json_1.default);
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
test('Parsing two times', function () {
    var animal = new Animal_1.Animal({
        id: 2,
    });
    animal.fromBackend({
        data: { name: 'Woofer' },
    });
    expect(animal.id).toBe(2);
    expect(animal.name).toBe('Woofer');
});
test('Parsing empty relation (with repos)', function () {
    var location = new Customer_1.Location({}, { relations: ['bestCook.currentWork'] });
    location.fromBackend({
        data: customers_location_best_cook_work_places_json_1.default.data,
        repos: customers_location_best_cook_work_places_json_1.default.with,
        relMapping: customers_location_best_cook_work_places_json_1.default.with_mapping,
    });
    // @ts-ignore
    expect(location.bestCook.id).toBe(null);
});
test('Parsing empty relation (direct api response)', function () {
    var location = new Customer_1.Location({}, { relations: ['bestCook.currentWork'] });
    location.fromBackend(customers_location_best_cook_work_places_json_1.default);
    // @ts-ignore
    expect(location.bestCook.id).toBe(null);
});
test('Parsing empty relation which was already set', function () {
    var location = new Customer_1.Location({
        bestCook: {
            id: 1,
            name: 'Zaico',
            profession: 'Programmer',
        },
    }, { relations: ['bestCook.currentWork'] });
    // @ts-ignore
    expect(location.bestCook.id).toBe(1);
    // @ts-ignore
    expect(location.bestCook.name).toBe('Zaico');
    // @ts-ignore
    expect(location.bestCook.profession).toBe('Programmer');
    location.fromBackend({
        data: customers_location_best_cook_work_places_json_1.default.data,
        repos: customers_location_best_cook_work_places_json_1.default.with,
        relMapping: customers_location_best_cook_work_places_json_1.default.with_mapping,
    });
    // @ts-ignore
    expect(location.bestCook.id).toBe(null);
    // @ts-ignore
    expect(location.bestCook.name).toBe('');
    // @ts-ignore
    expect(location.bestCook.profession).toBe('chef');
});
test('Parsing two-level relation (nested)', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['kind.breed'],
    });
    animal.fromBackend({
        data: animal_with_kind_breed_nested_json_1.default.data,
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
test('Parsing store relation (nested)', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['pastOwners'],
    });
    animal.fromBackend({
        data: animal_with_kind_breed_nested_json_1.default.data,
    });
    expect(animal.id).toBe(1);
    // @ts-ignore
    expect(animal.pastOwners.length).toBe(2);
    // @ts-ignore
    expect(animal.pastOwners.map('id')).toEqual([50, 51]);
});
test('Parsing two times with store relation', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['pastOwners'],
    });
    // @ts-ignore
    animal.pastOwners.parse([{ id: 3 }]);
    // @ts-ignore
    expect(animal.pastOwners.map('id')).toEqual([3]);
    animal.parse({
        name: 'Pupper',
    });
    // @ts-ignore
    expect(animal.pastOwners.map('id')).toEqual([3]);
});
test('Parsing store relation with model relation in it', function () {
    var animal = new Animal_1.Animal(null, {
        relations: ['pastOwners.town'],
    });
    // @ts-ignore
    expect(animal.pastOwners).not.toBeUndefined();
    // @ts-ignore
    expect(animal.pastOwners).toBeInstanceOf(Animal_1.PersonStore);
    animal.fromBackend({
        data: animals_with_past_owners_and_town_json_1.default.data,
        repos: animals_with_past_owners_and_town_json_1.default.with,
        relMapping: animals_with_past_owners_and_town_json_1.default.with_mapping,
    });
    // @ts-ignore
    expect(animal.pastOwners.map('id')).toEqual([55, 66]);
    // @ts-ignore
    expect(animal.pastOwners.get(55).town).toBeInstanceOf(Animal_1.Location);
    // @ts-ignore
    expect(animal.pastOwners.get(55).town.id).toBe(10);
    // @ts-ignore
    expect(animal.pastOwners.get(55).town.name).toBe('Eindhoven');
    // @ts-ignore
    expect(animal.pastOwners.get(66).town.id).toBe(11);
    // @ts-ignore
    expect(animal.pastOwners.get(66).town.name).toBe('Breda');
});
test('Parsing Store -> Model -> Store relation', function () {
    var customer = new Customer_1.Customer(null, {
        relations: ['oldTowns.bestCook.workPlaces'],
    });
    customer.fromBackend({
        data: customers_with_town_cook_restaurant_json_1.default.data,
        repos: customers_with_town_cook_restaurant_json_1.default.with,
        relMapping: customers_with_town_cook_restaurant_json_1.default.with_mapping,
    });
    // @ts-ignore
    expect(customer.oldTowns.at(0).bestCook.id).toBe(50);
    // @ts-ignore
    expect(customer.oldTowns.at(0).bestCook.workPlaces.map('id')).toEqual([
        5,
        6,
    ]);
});
test('Parsing Model -> Model -> Store with a nullable fk', function () {
    var customer = new Customer_1.Customer(null, {
        relations: ['town.restaurants']
    });
    customer.fromBackend({
        data: customers_with_town_cook_restaurant_json_1.default.data,
        repos: customers_with_town_cook_restaurant_json_1.default.with,
        relMapping: customers_with_town_cook_restaurant_json_1.default.with_mapping,
    });
    // @ts-ignore
    expect(customer.town.restaurants.length).toBe(0);
});
test('toBackend with basic properties', function () {
    var animal = new Animal_1.Animal({
        id: 3,
        name: 'Donkey',
    });
    var serialized = animal.toBackend();
    expect(serialized).toEqual({
        id: 3,
        name: 'Donkey',
    });
});
test('toBackend with relations', function () {
    var animal = new Animal_1.Animal({
        id: 4,
        name: 'Donkey',
    }, { relations: ['kind', 'owner'] });
    // @ts-ignore
    animal.kind.id = 8;
    var serialized = animal.toBackend();
    expect(serialized).toEqual({
        id: 4,
        name: 'Donkey',
        kind: 8,
        owner: null,
    });
});
test('toBackend with pick fields', function () {
    var TestModel = /** @class */ (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.api = new BinderApi_1.BinderApi();
            _this.id = 1;
            _this.name = 'Joe';
            _this.color = 'red';
            return _this;
        }
        TestModel.backendResourceName = 'resource';
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "id", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "name", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "color", void 0);
        TestModel = __decorate([
            Model_1.tsPatch
        ], TestModel);
        return TestModel;
    }(Model_1.Model));
    var model = new TestModel();
    // The id field seems to be required i.e cannot be
    // picked away
    model.pickFields = function () {
        return ['color'];
    };
    var serialized = model.toBackend();
    expect(serialized).toEqual({
        color: 'red',
        id: 1
    });
});
test('toBackend with pick fields as static attribute', function () {
    var TestModel = /** @class */ (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.api = new BinderApi_1.BinderApi();
            _this.id = 1;
            _this.name = 'Joe';
            _this.color = 'red';
            return _this;
        }
        TestModel.backendResourceName = 'resource';
        TestModel.pickFields = ['color'];
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "id", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "name", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "color", void 0);
        TestModel = __decorate([
            Model_1.tsPatch
        ], TestModel);
        return TestModel;
    }(Model_1.Model));
    var serialized = new TestModel().toBackend();
    expect(serialized).toEqual({
        color: 'red',
        id: 1
    });
});
test('toBackend with pick fields arrow function', function () {
    var TestModel = /** @class */ (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.api = new BinderApi_1.BinderApi();
            _this.pickFields = function () { return ['color']; };
            _this.id = 1;
            _this.name = 'Joe';
            _this.color = 'red';
            return _this;
        }
        TestModel.backendResourceName = 'resource';
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "id", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "name", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "color", void 0);
        TestModel = __decorate([
            Model_1.tsPatch
        ], TestModel);
        return TestModel;
    }(Model_1.Model));
    var model = new TestModel();
    var serialized = model.toBackend();
    expect(serialized).toEqual({
        color: 'red',
        id: 1
    });
});
test('toBackend with omit fields', function () {
    var TestModel = /** @class */ (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.api = new BinderApi_1.BinderApi();
            _this.id = 1;
            _this.name = 'Joe';
            _this.color = 'red';
            _this.weight = 76;
            _this.height = 196;
            return _this;
        }
        TestModel.backendResourceName = 'resource';
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "id", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "name", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "color", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "weight", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "height", void 0);
        TestModel = __decorate([
            Model_1.tsPatch
        ], TestModel);
        return TestModel;
    }(Model_1.Model));
    ;
    var model = new TestModel();
    model.omitFields = function () {
        return ['weight', 'height', 'name'];
    };
    var serialized = model.toBackend();
    expect(serialized).toEqual({
        color: 'red',
        id: 1
    });
});
test('toBackend with omit fields as static attribute', function () {
    var TestModel = /** @class */ (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.api = new BinderApi_1.BinderApi();
            _this.id = 1;
            _this.name = 'Joe';
            _this.color = 'red';
            _this.weight = 76;
            _this.height = 196;
            return _this;
        }
        TestModel.backendResourceName = 'resource';
        TestModel.omitFields = ['weight', 'height', 'name'];
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "id", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "name", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "color", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "weight", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "height", void 0);
        TestModel = __decorate([
            Model_1.tsPatch
        ], TestModel);
        return TestModel;
    }(Model_1.Model));
    ;
    var model = new TestModel();
    var serialized = model.toBackend();
    expect(serialized).toEqual({
        color: 'red',
        id: 1
    });
});
test('toBackend with omit fields as arrow function', function () {
    var TestModel = /** @class */ (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.api = new BinderApi_1.BinderApi();
            _this.omitFields = function () { return ['weight', 'height', 'name']; };
            _this.id = 1;
            _this.name = 'Joe';
            _this.color = 'red';
            _this.weight = 76;
            _this.height = 196;
            return _this;
        }
        TestModel.backendResourceName = 'resource';
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "id", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "name", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "color", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "weight", void 0);
        __decorate([
            mobx_1.observable
        ], TestModel.prototype, "height", void 0);
        TestModel = __decorate([
            Model_1.tsPatch
        ], TestModel);
        return TestModel;
    }(Model_1.Model));
    ;
    var model = new TestModel();
    var serialized = model.toBackend();
    expect(serialized).toEqual({
        color: 'red',
        id: 1
    });
});
test('toBackend with specified attributes & relations', function () {
    var animal = new Animal_1.Animal({
        id: 4,
        name: 'Donkey',
    }, { relations: ['kind', 'owner'] });
    // @ts-ignore
    animal.kind.id = 8;
    var serialized = animal.toBackend({ fields: ['id', 'kind'] });
    expect(serialized).toEqual({
        id: 4,
        kind: 8,
    });
});
test('toBackend with store relation', function () {
    var animal = new Animal_1.Animal({
        id: 4,
    }, { relations: ['pastOwners'] });
    // @ts-ignore
    animal.pastOwners.parse([{ id: 5 }]);
    var serialized = animal.toBackend();
    expect(serialized).toEqual({
        id: 4,
        name: '',
        past_owners: [5],
    });
});
test('toBackendAll with model relation', function () {
    var animal = new Animal_1.Animal({
        id: 4,
    }, { relations: ['kind.breed', 'owner'] });
    // @ts-ignore
    animal.kind.parse({ id: 5 });
    var serialized = animal.toBackendAll({
        nestedRelations: { kind: { breed: {} }, owner: {} },
    });
    expect(serialized).toMatchSnapshot();
});
test('toBackendAll without relations', function () {
    var animal = new Animal_1.Animal({
        id: 4,
    }, { relations: ['kind.breed', 'owner'] });
    // @ts-ignore
    animal.kind.parse({ id: 5 });
    // Purposefully pass no parameters to toBackendAll()
    var serialized = animal.toBackendAll();
    expect(serialized).toMatchSnapshot();
});
test('toBackendAll with partial relations', function () {
    var animal = new Animal_1.Animal({
        name: 'Doggo',
        // @ts-ignore
        kind: { name: 'Dog' },
        owner: { name: 'Henk', town: { name: 'Ehv' } },
    }, { relations: ['kind', 'owner.town'] });
    var serialized = animal.toBackendAll({ nestedRelations: { owner: {} } });
    expect(serialized).toMatchSnapshot();
});
test('Internal relation list should not contain duplicates', function () {
    // I really should not test internals, but this caused hard-to-find bugs in the past
    // so I want to be sure this works.
    var animal = new Animal_1.Animal({}, { relations: ['kind', 'kind.breed'] });
    expect(animal.__activeCurrentRelations).toEqual(['kind']);
});
test('toBackendAll with store relation', function () {
    var animal = new Animal_1.Animal({}, { relations: ['pastOwners'] });
    // @ts-ignore
    animal.pastOwners.parse([
        { name: 'Bar' },
        { name: 'Foo' },
        { id: 10, name: 'R' },
    ]);
    var serialized = animal.toBackendAll({ nestedRelations: { pastOwners: {} } });
    expect(serialized).toMatchSnapshot();
});
test('toBackendAll should de-duplicate relations', function () {
    var animal = new Animal_1.Animal({}, { relations: ['pastOwners.town'] });
    // @ts-ignore
    animal.pastOwners.parse([{ name: 'Bar' }, { name: 'Foo' }]);
    // This is something you should never do, so maybe this is a bad test?
    // @ts-ignore
    var animalBar = animal.pastOwners.at(0);
    // @ts-ignore
    animal.pastOwners.models[1] = animalBar;
    // This isn't the real test, just a check.
    // @ts-ignore
    expect(animalBar.cid).toBe(animal.pastOwners.at(1).cid);
    var serialized = animal.toBackendAll({
        nestedRelations: { pastOwners: { town: {} } },
    });
    expect(serialized).toMatchSnapshot();
});
test('toBackendAll with deep nested relation', function () {
    // It's very important to test what happens when the same relation ('location') is used twice + is nested.
    var animal = new Animal_1.Animal({}, { relations: ['kind.location', 'kind.breed.location'] });
    // @ts-ignore
    animal.kind.parse({
        name: 'Aap',
        location: { name: 'Apenheul' },
        breed: { name: 'MyBreed', location: { name: 'Amerika' } },
    });
    var serialized = animal.toBackendAll({
        nestedRelations: { kind: { location: {}, breed: { location: {} } } },
    });
    expect(serialized).toMatchSnapshot();
});
test('toBackendAll with nested store relation', function () {
    // It's very important to test what happens when the same relation ('location') is used twice + is nested.
    var animal = new Animal_1.Animal({}, { relations: ['pastOwners.town'] });
    // @ts-ignore
    animal.pastOwners.parse([
        {
            name: 'Henk',
            town: {
                name: 'Eindhoven',
            },
        },
        {
            name: 'Krol',
            town: {
                name: 'Breda',
            },
        },
    ]);
    var serialized = animal.toBackendAll({
        nestedRelations: { pastOwners: { town: {} } },
    });
    expect(serialized).toMatchSnapshot();
});
test('toBackendAll with `backendResourceName` property model', function () {
    var animal = new Animal_1.AnimalResourceName({}, { relations: ['blaat', 'owners', 'pastOwners'] });
    animal.parse({
        id: 1,
        blaat: {
            id: 2,
        },
        owners: [
            {
                id: 3,
            },
        ],
        pastOwners: [
            {
                id: 4,
            },
        ],
    });
    var serialized = animal.toBackendAll({
        nestedRelations: { blaat: {}, owners: {}, pastOwners: {} },
    });
    expect(serialized).toMatchSnapshot();
});
// We can't test it because defining backendResourceName as non-static causes a
// compile error.
// test('backendResourceName defined as not static should throw error', () => {
//     class Zebra extends Model<{}> {
//         backendResourceName = 'blaat';
//     }
//     expect(() => {
//         return new Zebra();
//     }).toThrow(
//         '`backendResourceName` should be a static property on the model.'
//     );
// });
// We can't test this because overriding mobx-spine attributes is a compile error.
// test('Attribute already used by mobx-spine should throw error', () => {
//     // E.g. the `url` property is used by mobx-spine, so you can't use it as an attribute.
//     class Zebra extends Model<{}> {
//         @observable url = '';
//     }
//     expect(() => {
//         return new Zebra();
//     }).toThrow('Forbidden attribute key used: `url`');
// });
test('toBackend with frontend-only prop', function () {
    var animal = new Animal_1.AnimalWithFrontendProp({
        id: 3,
        _frontend: 'Donkey',
    });
    var serialized = animal.toBackend();
    expect(animal._frontend).toBe('Donkey');
    expect(serialized).toEqual({
        id: 3,
    });
});
test('toBackend with observable array', function () {
    var animal = new Animal_1.AnimalWithArray({
        foo: ['q', 'a'],
    });
    expect(animal.toBackend()).toEqual({
        foo: ['q', 'a'],
    });
});
test('clear with basic attribute', function () {
    var animal = new Animal_1.Animal({
        id: 2,
        name: 'Monkey',
    });
    animal.clear();
    expect(animal.id).toBe(null);
    expect(animal.name).toBe('');
});
test('clear with relations', function () {
    var animal = new Animal_1.Animal({
        id: 5,
        name: 'Donkey kong',
    }, { relations: ['kind', 'owner'] });
    // @ts-ignore
    animal.kind.id = 8;
    animal.clear();
    // @ts-ignore
    expect(animal.kind.id).toBe(null);
});
test('clear with array attribute', function () {
    var animal = new Animal_1.AnimalWithArray();
    animal.foo.push('bar');
    expect(mobx_1.toJS(animal.foo)).toEqual(['bar']);
    animal.clear();
    expect(mobx_1.toJS(animal.foo)).toEqual([]);
});
test('clear with object attribute', function () {
    var animal = new Animal_1.AnimalWithObject();
    animal.foo['bar'] = true;
    expect(mobx_1.toJS(animal.foo)).toEqual({ bar: true });
    animal.clear();
    expect(mobx_1.toJS(animal.foo)).toEqual({});
});
test('toJS with basic attributes', function () {
    var animal = new Animal_1.Animal({
        id: 4,
        name: 'japser',
    });
    expect(animal.toJS()).toEqual({
        id: 4,
        name: 'japser',
    });
});
test('toJS with relations', function () {
    var animal = new Animal_1.Animal({
        id: 4,
        name: 'japser',
        // @ts-ignore
        kind: { id: 8, breed: { id: 10 } },
    }, { relations: ['kind.breed'] });
    expect(animal.toJS()).toEqual({
        id: 4,
        name: 'japser',
        kind: {
            id: 8,
            name: '',
            breed: {
                id: 10,
                name: '',
            },
        },
    });
});
test('toJS with observable array', function () {
    var animal = new Animal_1.AnimalWithArray({
        foo: ['q', 'a'],
    });
    expect(animal.toJS()).toEqual({
        foo: ['q', 'a'],
    });
});
test('fetch without id', function () {
    var animal = new Animal_1.Animal();
    expect(function () { return animal.fetch(); }).toThrow('[mobx-spine] Trying to fetch a model without an id');
});
test('delete without id and store', function () {
    var animal = new Animal_1.Animal();
    expect(animal.delete()).toBeInstanceOf(Promise);
});
test('fetch without api', function () {
    var animal = new Animal_1.AnimalWithoutApi({ id: 2 });
    expect(function () { return animal.fetch(); }).toThrow('[mobx-spine] You are trying to perform an API request without an `api` property defined on the model.');
});
test('fetch without url', function () {
    var animal = new Animal_1.AnimalWithoutUrl({ id: 2 });
    expect(function () { return animal.fetch(); }).toThrow('You are trying to perform an API request without a `urlRoot` property defined on the model.');
});
test('setInput to clear backend validation errors', function () {
    var animal = new Animal_1.Animal();
    animal.__backendValidationErrors = { name: ['required'] };
    expect(mobx_1.toJS(animal.backendValidationErrors['name'])).toEqual(['required']);
    animal.setInput('name', 'Jo');
    expect(animal.name).toBe('Jo');
    expect(animal.backendValidationErrors['name']).toBe(undefined);
});
test('allow custom validationErrorFormatter', function () {
    var _a;
    var location = new (_a = /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.validationErrorFormatter = function (obj) {
                return obj.msg;
            };
            return class_1;
        }(Animal_1.Location)),
        _a.backendResourceName = 'location',
        _a)({ id: 2 });
    location.parseValidationErrors({
        location: {
            2: {
                name: [{ msg: 'Error 1' }, { msg: 'Error 2' }],
            },
        },
    });
    expect(mobx_1.toJS(location.backendValidationErrors)).toEqual({
        name: ['Error 1', 'Error 2'],
    });
});
test('setInput on non-existing field', function () {
    var animal = new Animal_1.Animal();
    expect(function () {
        return animal.setInput('asdf', 'Jo');
    }).toThrow("[mobx-spine] Field 'asdf' doesn't exist on the model.");
});
test('setInput to parse model relation', function () {
    var animal = new Animal_1.Animal(null, { relations: ['kind'] });
    var kind = new Animal_1.Kind({ id: 100 });
    animal.__backendValidationErrors = { kind: ['required'] };
    animal.setInput('kind', kind);
    // @ts-ignore
    expect(animal.kind.id).toBe(100);
    // it should parse to a new model, not the existing one
    // @ts-ignore
    expect(animal.kind.cid).not.toBe(kind.cid);
    expect(animal.backendValidationErrors['kind']).toBe(undefined);
    animal.setInput('kind', null);
    // @ts-ignore
    expect(animal.kind.id).toBe(null);
});
test('setInput to parse store relation', function () {
    var animal = new Animal_1.Animal(null, { relations: ['pastOwners'] });
    var pastOwners = [new Animal_1.Person({ id: 2 }), new Animal_1.Person({ id: 3 })];
    animal.setInput('pastOwners', pastOwners);
    // @ts-ignore
    expect(animal.pastOwners.map('id')).toEqual([2, 3]);
    // @ts-ignore
    expect(animal.pastOwners.at(0).cid).not.toBe(pastOwners[0].cid);
    animal.setInput('pastOwners', null);
    // @ts-ignore
    expect(animal.pastOwners.length).toBe(0);
});
test('parse empty list', function () {
    var animal = new Animal_1.Animal(
    // @ts-ignore
    { pastOwners: [{}, {}] }, { relations: ['pastOwners'] });
    // @ts-ignore
    expect(animal.pastOwners.length).toEqual(2);
    // @ts-ignore
    animal.parse({ pastOwners: [] });
    // @ts-ignore
    expect(animal.pastOwners.length).toEqual(0);
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
        var animal = new Animal_1.Animal({ id: 2 });
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/api/animal/2/');
            expect(config.method).toBe('get');
            expect(config.params).toEqual({ with: null });
            return [200, { data: { id: 2, name: 'Madagascar' } }];
        });
        return animal.fetch().then(function () {
            expect(animal.id).toBe(2);
        });
    });
    test('fetch with relations', function () {
        var animal = new Animal_1.Animal({ id: 2 }, {
            relations: ['kind.breed'],
        });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: 'kind.breed',
            });
            return [200, animal_with_kind_breed_json_1.default];
        });
        return animal.fetch().then(function () {
            expect(animal.id).toBe(1);
            // @ts-ignore
            expect(animal.kind.id).toBe(4);
            // @ts-ignore
            expect(animal.kind.breed.id).toBe(3);
        });
    });
    test('fetch with camelCased relations', function () {
        var animal = new Animal_1.Animal({ id: 2 }, {
            relations: ['pastOwners'],
        });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: 'past_owners',
            });
            return [200, animals_with_past_owners_and_town_json_1.default];
        });
        return animal.fetch();
    });
    test('fetch with default params', function () {
        var animal = new Animal_1.Animal({ id: 2 });
        animal.setFetchParams({ projectId: 1 });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                with: null,
                projectId: 1,
            });
            return [200, {}];
        });
        return animal.fetch();
    });
    test('fetch with custom buildFetchData', function () {
        var TestModel = /** @class */ (function (_super) {
            __extends(TestModel, _super);
            function TestModel() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.api = new BinderApi_1.BinderApi();
                _this.id = 1;
                return _this;
            }
            TestModel.prototype.buildFetchData = function (options) {
                return { custom: 'data' };
            };
            TestModel.backendResourceName = 'resource';
            __decorate([
                mobx_1.observable
            ], TestModel.prototype, "id", void 0);
            TestModel = __decorate([
                Model_1.tsPatch
            ], TestModel);
            return TestModel;
        }(Model_1.Model));
        ;
        var model = new TestModel();
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({
                custom: 'data'
            });
            return [200, {
                    data: {},
                }];
        });
        return model.fetch();
    });
    test('fetch should pass through request options', function () {
        var myApi = new BinderApi_1.BinderApi();
        mock.onAny().replyOnce(200, {});
        var spy = jest.spyOn(myApi, 'get');
        var Zebra = /** @class */ (function (_super) {
            __extends(Zebra, _super);
            function Zebra() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.api = myApi;
                _this.id = null;
                return _this;
            }
            Zebra.backendResourceName = 'zebra';
            __decorate([
                mobx_1.observable
            ], Zebra.prototype, "id", void 0);
            Zebra = __decorate([
                Model_1.tsPatch
            ], Zebra);
            return Zebra;
        }(Model_1.Model));
        var zebra = new Zebra({ id: 1 });
        zebra.fetch({ skipRequestErrors: true });
        expect(spy).toHaveBeenCalledWith('/zebra/1/', { with: null }, { skipRequestErrors: true });
    });
    test('fetch with auto-generated URL', function () {
        var kind = new Animal_1.KindResourceName({ id: 2 });
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/kind/2/');
            return [200, {}];
        });
        return kind.fetch();
    });
    test('save new with basic properties', function () {
        var animal = new Animal_1.Animal({ name: 'Doggo' });
        var spy = jest.spyOn(animal, 'saveFromBackend');
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/api/animal/');
            expect(config.method).toBe('post');
            expect(config.data).toBe('{"id":null,"name":"Doggo"}');
            return [201, { id: 10, name: 'Doggo' }];
        });
        return animal.save().then(function () {
            expect(animal.id).toBe(10);
            expect(spy).toHaveBeenCalled();
            spy.mockReset();
            spy.mockRestore();
        });
    });
    test('save existing with basic properties', function () {
        var animal = new Animal_1.Animal({ id: 12, name: 'Burhan' });
        mock.onAny().replyOnce(function (config) {
            expect(config.method).toBe('patch');
            return [200, { id: 12, name: 'Burhan' }];
        });
        return animal.save().then(function () {
            expect(animal.id).toBe(12);
        });
    });
    test('save fail with basic properties', function () {
        var animal = new Animal_1.Animal({ name: 'Nope' });
        mock.onAny().replyOnce(400, save_fail_json_1.default);
        return animal.save().catch(function () {
            var valErrors = mobx_1.toJS(animal.backendValidationErrors);
            expect(valErrors).toEqual({
                name: ['required'],
                kind: ['blank'],
            });
        });
    });
    test('save new model fail with basic properties', function () {
        var animal = new Animal_1.Animal({ name: 'Nope' });
        mock.onAny().replyOnce(400, save_new_fail_json_1.default);
        return animal.save().catch(function () {
            var valErrors = mobx_1.toJS(animal.backendValidationErrors);
            expect(valErrors).toEqual({
                name: ['invalid'],
            });
        });
    });
    test('save fail with 500', function () {
        var animal = new Animal_1.Animal({ name: 'Nope' });
        mock.onAny().replyOnce(500, {});
        return animal.save().catch(function () {
            var valErrors = mobx_1.toJS(animal.backendValidationErrors);
            expect(valErrors).toEqual({});
        });
    });
    test('save with params', function () {
        var animal = new Animal_1.Animal();
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({ branch_id: 1 });
            return [201, {}];
        });
        return animal.save({ params: { branch_id: 1 } });
    });
    test('save with custom data', function () {
        var animal = new Animal_1.Animal();
        mock.onAny().replyOnce(function (config) {
            expect(JSON.parse(config.data)).toEqual({ id: null, name: '', extra_data: 'can be saved' });
            return [201, {}];
        });
        return animal.save({ data: { extra_data: 'can be saved' } });
    });
    test('save with mapped data', function () {
        var animal = new Animal_1.Animal();
        mock.onAny().replyOnce(function (config) {
            expect(JSON.parse(config.data)).toEqual({ id: 'overwritten', name: '' });
            return [201, {}];
        });
        return animal.save({ mapData: function (data) { return (__assign(__assign({}, data), { id: 'overwritten' })); } });
    });
    test('save with custom and mapped data', function () {
        var animal = new Animal_1.Animal();
        mock.onAny().replyOnce(function (config) {
            expect(JSON.parse(config.data)).toEqual({ id: 'overwritten', name: '', extra_data: 'can be saved' });
            return [201, {}];
        });
        return animal.save({ data: { extra_data: 'can be saved' }, mapData: function (data) { return (__assign(__assign({}, data), { id: 'overwritten' })); } });
    });
    test('save all with relations', function () {
        var animal = new Animal_1.Animal({
            name: 'Doggo',
            // @ts-ignore
            kind: { name: 'Dog' },
            pastOwners: [{ name: 'Henk' }],
        }, { relations: ['kind', 'pastOwners'] });
        var spy = jest.spyOn(animal, 'saveFromBackend');
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/api/animal/');
            expect(config.method).toBe('put');
            return [201, animals_multi_put_response_json_1.default];
        });
        return animal.saveAll({ relations: ['kind'] }).then(function (response) {
            expect(spy).toHaveBeenCalled();
            expect(animal.id).toBe(10);
            // @ts-ignore
            expect(animal.kind.id).toBe(4);
            // @ts-ignore
            expect(animal.pastOwners.at(0).id).toBe(100);
            expect(response).toEqual(animals_multi_put_response_json_1.default);
            spy.mockReset();
            spy.mockRestore();
        });
    });
    test('save all with relations - verify ids are mapped correctly', function () {
        var animal = new Animal_1.Animal({
            // @ts-ignore
            pastOwners: [{ name: 'Henk' }, { id: 125, name: 'Hanos' }],
        }, { relations: ['pastOwners'] });
        // Sanity check unrelated to the actual test.
        // @ts-ignore
        expect(animal.pastOwners.at(0).getInternalId()).toBe(-2);
        mock.onAny().replyOnce(function (config) {
            return [
                201,
                { idmap: { animal: [[-1, 10]], person: [[-2, 100]] } },
            ];
        });
        return animal.saveAll({ relations: ['pastOwners'] }).then(function () {
            // @ts-ignore
            expect(animal.pastOwners.map('id')).toEqual([100, 125]);
        });
    });
    test('save all with validation errors', function () {
        var animal = new Animal_1.Animal({
            name: 'Doggo',
            // @ts-ignore
            kind: { name: 'Dog' },
            pastOwners: [{ name: 'Jo', town: { id: 5, name: '' } }],
        }, { relations: ['kind', 'pastOwners.town'] });
        mock.onAny().replyOnce(function (config) {
            return [400, animals_multi_put_error_json_1.default];
        });
        return animal.saveAll({ relations: ['kind'] }).then(function () { }, function (err) {
            if (!err.response) {
                throw err;
            }
            // @ts-ignore
            expect(mobx_1.toJS(animal.backendValidationErrors).name).toEqual([
                'blank',
            ]);
            // @ts-ignore
            expect(mobx_1.toJS(animal.kind.backendValidationErrors).name).toEqual([
                'required',
            ]);
            expect(
            // @ts-ignore
            mobx_1.toJS(animal.pastOwners.at(0).backendValidationErrors).name).toEqual(['required']);
            expect(
            // @ts-ignore
            mobx_1.toJS(animal.pastOwners.at(0).town.backendValidationErrors)
                .name).toEqual(['maxlength']);
        });
    });
    test('save all with validation errors and check if it clears them', function () {
        var animal = new Animal_1.Animal({
            name: 'Doggo',
            // @ts-ignore
            pastOwners: [{ name: 'Jo', town: { id: 5, name: '' } }],
        }, { relations: ['pastOwners.town'] });
        // We first trigger a save with validation errors from the backend, then we trigger a second save which fixes those validation errors,
        // then we check if the errors get cleared.
        mock.onAny().replyOnce(function (config) {
            return [400, animals_multi_put_error_json_1.default];
        });
        var options = { relations: ['pastOwners.town'] };
        return animal.saveAll(options).then(function () { }, function (err) {
            if (!err.response) {
                throw err;
            }
            mock.onAny().replyOnce(200, { idmap: [] });
            return animal.saveAll(options).then(function () {
                var valErrors1 = mobx_1.toJS(
                // @ts-ignore
                animal.pastOwners.at(0).backendValidationErrors);
                expect(valErrors1).toEqual({});
                var valErrors2 = mobx_1.toJS(
                // @ts-ignore
                animal.pastOwners.at(0).town.backendValidationErrors);
                expect(valErrors2).toEqual({});
            });
        });
    });
    test('save all with existing model', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { id: 10, name: 'Doggo', kind: { name: 'Dog' } }, { relations: ['kind'] });
        mock.onAny().replyOnce(function (config) {
            expect(config.url).toBe('/api/animal/');
            expect(config.method).toBe('put');
            var putData = JSON.parse(config.data);
            expect(putData).toMatchSnapshot();
            return [201, animals_multi_put_response_json_1.default];
        });
        return animal.saveAll({ relations: ['kind'] });
    });
    test('save all with empty response from backend', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { name: 'Doggo', kind: { name: 'Dog' } }, { relations: ['kind'] });
        mock.onAny().replyOnce(function (config) {
            return [201, {}];
        });
        return animal.saveAll();
    });
    test('save all fail', function () {
        var animal = new Animal_1.Animal({});
        mock.onAny().replyOnce(function () {
            return [500, {}];
        });
        var promise = animal.saveAll();
        expect(animal.isLoading).toBe(true);
        return promise.catch(function () {
            expect(animal.isLoading).toBe(false);
        });
    });
    test('delete existing with basic properties', function () {
        var animal = new Animal_1.Animal({ id: 12, name: 'Burhan' });
        mock.onAny().replyOnce(function (config) {
            expect(config.method).toBe('delete');
            expect(config.url).toBe('/api/animal/12/');
            return [204, null];
        });
        return animal.delete();
    });
    test('delete existing with basic properties and remove from store', function () {
        var animalStore = new Animal_1.AnimalStore().parse([
            { id: 12, name: 'Burhan' },
        ]);
        var animal = animalStore.at(0);
        mock.onAny().replyOnce(function (config) {
            return [204, null];
        });
        var promise = animal.delete();
        expect(animalStore.at(0)).toBeInstanceOf(Animal_1.Animal);
        return promise.then(function () {
            expect(animalStore.length).toBe(0);
        });
    });
    test('delete existing with basic properties and remove from store without immediate', function () {
        var animalStore = new Animal_1.AnimalStore().parse([
            { id: 12, name: 'Burhan' },
        ]);
        var animal = animalStore.at(0);
        mock.onAny().replyOnce(function (config) {
            return [204, null];
        });
        expect(animalStore.at(0)).toBeInstanceOf(Animal_1.Animal);
        var promise = animal.delete({ immediate: true });
        expect(animalStore.length).toBe(0);
        return promise;
    });
    test('delete with params', function () {
        var animal = new Animal_1.Animal({ id: 1 });
        mock.onAny().replyOnce(function (config) {
            expect(config.params).toEqual({ branch_id: 1 });
            return [204, null];
        });
        return animal.delete({ params: { branch_id: 1 } });
    });
    test('delete with requestOptions', function () {
        var animal = new Animal_1.Animal({ id: 1 });
        var spy = jest.spyOn(animal.api, 'delete');
        var requestOptions = {
            params: { branch_id: 1 },
            skipRequestErrors: true,
        };
        mock.onAny().replyOnce(function (config) {
            return [204, null];
        });
        animal.delete(requestOptions);
        expect(spy).toHaveBeenCalledWith('/api/animal/1/', null, requestOptions);
    });
    test('isLoading', function () {
        var animal = new Animal_1.Animal({ id: 2 });
        expect(animal.isLoading).toBe(false);
        mock.onAny().replyOnce(function () {
            expect(animal.isLoading).toBe(true);
            return [200, { id: 2 }];
        });
        return animal.fetch().then(function () {
            expect(animal.isLoading).toBe(false);
        });
    });
    test('isLoading with failed request', function () {
        var animal = new Animal_1.Animal({ id: 2 });
        mock.onAny().replyOnce(function () {
            expect(animal.isLoading).toBe(true);
            return [404];
        });
        return animal.fetch().catch(function () {
            expect(animal.isLoading).toBe(false);
        });
    });
    test('hasUserChanges should clear changes in current fields after save', function () {
        var animal = new Animal_1.Animal({ id: 1 });
        animal.setInput('name', 'Felix');
        mock.onAny().replyOnce(function () {
            // Server returns another name, shouldn't be seen as a change.
            return [200, { id: 1, name: 'Garfield' }];
        });
        return animal.save().then(function () {
            expect(animal.hasUserChanges).toBe(false);
            expect(animal.name).toBe('Garfield');
        });
    });
    test('hasUserChanges should not clear changes in model relations when not saved', function () {
        var animal = new Animal_1.Animal({ id: 1 }, { relations: ['kind.breed'] });
        // @ts-ignore
        animal.kind.breed.setInput('name', 'Katachtige');
        expect(animal.hasUserChanges).toBe(true);
        mock.onAny().replyOnce(function () {
            return [200, {}];
        });
        return animal.save().then(function () {
            // Because we didn't save the relation, it should return true.
            expect(animal.hasUserChanges).toBe(true);
            // @ts-ignore
            expect(animal.kind.hasUserChanges).toBe(true);
            // @ts-ignore
            expect(animal.kind.breed.hasUserChanges).toBe(true);
        });
    });
    test('hasUserChanges should clear changes in saved model relations', function () {
        var animal = new Animal_1.Animal({ id: 1 }, { relations: ['kind.breed'] });
        // @ts-ignore
        animal.kind.breed.setInput('name', 'Katachtige');
        mock.onAny().replyOnce(function () {
            return [200, {}];
        });
        return animal.saveAll({ relations: ['kind.breed'] }).then(function () {
            expect(animal.hasUserChanges).toBe(false);
        });
    });
    test('hasUserChanges should not clear changes in non-saved models relations', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { id: 1, pastOwners: [
                { id: 2 },
                { id: 3 },
            ] }, { relations: ['pastOwners', 'kind.breed'] });
        // @ts-ignore
        animal.kind.breed.setInput('name', 'Katachtige');
        // @ts-ignore
        animal.pastOwners.get(2).setInput('name', 'Zaico');
        mock.onAny().replyOnce(function () {
            return [200, {}];
        });
        return animal.saveAll({ relations: ['kind.breed'] }).then(function () {
            expect(animal.hasUserChanges).toBe(true);
            // @ts-ignore
            expect(animal.pastOwners.hasUserChanges).toBe(true);
            // @ts-ignore
            expect(animal.pastOwners.get(2).hasUserChanges).toBe(true);
            // @ts-ignore
            expect(animal.pastOwners.get(3).hasUserChanges).toBe(false);
        });
    });
    test('hasUserChanges should clear set changes in saved relations', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { id: 1, pastOwners: [
                { id: 2 },
                { id: 3 },
            ] }, { relations: ['pastOwners', 'kind.breed'] });
        // @ts-ignore
        animal.pastOwners.add({});
        expect(animal.hasUserChanges).toBe(true);
        // @ts-ignore
        expect(animal.pastOwners.hasUserChanges).toBe(true);
        mock.onAny().replyOnce(function () {
            return [200, {}];
        });
        return animal.saveAll({ relations: ['pastOwners'] }).then(function () {
            // @ts-ignore
            expect(animal.pastOwners.hasUserChanges).toBe(false);
            expect(animal.hasUserChanges).toBe(false);
        });
    });
    test('hasUserChanges should not clear set changes in non-saved relations', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { id: 1, pastOwners: [
                { id: 2 },
                { id: 3 },
            ] }, { relations: ['pastOwners', 'kind.breed'] });
        // @ts-ignore
        animal.pastOwners.add({});
        expect(animal.hasUserChanges).toBe(true);
        // @ts-ignore
        expect(animal.pastOwners.hasUserChanges).toBe(true);
        mock.onAny().replyOnce(function () {
            return [200, {}];
        });
        return animal.saveAll().then(function () {
            // @ts-ignore
            expect(animal.pastOwners.hasUserChanges).toBe(true);
            expect(animal.hasUserChanges).toBe(true);
        });
    });
});
describe('changes', function () {
    test('toBackend should detect changes', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { id: 1, name: 'Lino', kind: { id: 2 } }, { relations: ['kind'] });
        var output = animal.toBackend({ onlyChanges: true });
        expect(output).toEqual({ id: 1 });
        animal.setInput('name', 'Lion');
        expect(mobx_1.toJS(animal.__changes)).toEqual(['name']);
        var output2 = animal.toBackend({ onlyChanges: true });
        // `kind: 2` should not appear in here.
        expect(output2).toEqual({
            id: 1,
            name: 'Lion',
        });
    });
    test('toBackend should detect changes - but not twice', function () {
        var animal = new Animal_1.Animal({ id: 1 });
        animal.setInput('name', 'Lino');
        animal.setInput('name', 'Lion');
        expect(mobx_1.toJS(animal.__changes)).toEqual(['name']);
        var output = animal.toBackend({ onlyChanges: true });
        expect(output).toEqual({
            id: 1,
            name: 'Lion',
        });
    });
    test('toBackendAll should detect changes', function () {
        var animal = new Animal_1.Animal({
            id: 1,
            name: 'Lino',
            // @ts-ignore
            kind: {
                id: 2,
                owner: { id: 4 },
            },
            pastOwners: [{ id: 5, name: 'Henk' }, { id: 6, name: 'Piet' }],
        }, { relations: ['kind.breed', 'owner', 'pastOwners'] });
        // @ts-ignore
        animal.pastOwners.at(1).setInput('name', 'Jan');
        // @ts-ignore
        animal.kind.breed.setInput('name', 'Cat');
        var output = animal.toBackendAll({
            // The `owner` relation is just here to verify that it is not included
            nestedRelations: { kind: { breed: {} }, pastOwners: {} },
            onlyChanges: true,
        });
        expect(output).toEqual({
            data: [{ id: 1, }],
            relations: {
                kind: [
                    {
                        id: 2,
                        breed: -3,
                    },
                ],
                breed: [
                    {
                        id: -3,
                        name: 'Cat',
                    },
                ],
                past_owners: [
                    {
                        id: 6,
                        name: 'Jan',
                    }
                ],
            },
        });
    });
    test('toBackendAll should detect added models', function () {
        var animal = new Animal_1.Animal({
            id: 1,
            name: 'Lino',
            // @ts-ignore
            kind: {
                id: 2,
                owner: { id: 4 },
            },
            pastOwners: [{ id: 5, name: 'Henk' }],
        }, { relations: ['kind.breed', 'owner', 'pastOwners'] });
        // @ts-ignore
        animal.pastOwners.add({ id: 6 });
        var output = animal.toBackendAll({
            // The `kind` and `breed` relations are just here to verify that they are not included
            nestedRelations: { kind: { breed: {} }, pastOwners: {} },
            onlyChanges: true,
        });
        expect(output).toEqual({
            data: [{ id: 1, past_owners: [5, 6] }],
            relations: {},
        });
    });
    test('toBackendAll should detect removed models', function () {
        var animal = new Animal_1.Animal({
            id: 1,
            name: 'Lino',
            // @ts-ignore
            kind: {
                id: 2,
                owner: { id: 4 },
            },
            pastOwners: [{ id: 5, name: 'Henk' }, { id: 6, name: 'Piet' }],
        }, { relations: ['kind.breed', 'owner', 'pastOwners'] });
        // @ts-ignore
        animal.pastOwners.removeById(6);
        var output = animal.toBackendAll({
            // The `kind` and `breed` relations are just here to verify that they are not included
            nestedRelations: { kind: { breed: {} }, pastOwners: {} },
            onlyChanges: true,
        });
        expect(output).toEqual({
            data: [{ id: 1, past_owners: [5] }],
            relations: {},
        });
    });
    test('toBackendAll without onlyChanges should serialize all relations', function () {
        var animal = new Animal_1.Animal({
            id: 1,
            name: 'Lino',
            // @ts-ignore
            kind: {
                id: 2,
                breed: { name: 'Cat' },
                owner: { id: 4 },
            },
            pastOwners: [{ id: 5, name: 'Henk' }],
        }, { relations: ['kind.breed', 'owner', 'pastOwners'] });
        var output = animal.toBackendAll({
            nestedRelations: { kind: { breed: {} }, pastOwners: {} },
            onlyChanges: false,
        });
        expect(output).toEqual({
            data: [{
                    id: 1,
                    name: 'Lino',
                    kind: 2,
                    owner: null,
                    past_owners: [5]
                }],
            relations: {
                kind: [
                    {
                        id: 2,
                        breed: -3,
                        name: '',
                    },
                ],
                breed: [
                    {
                        id: -3,
                        name: 'Cat',
                    },
                ],
                past_owners: [{
                        id: 5,
                        name: 'Henk'
                    }],
            },
        });
    });
    test('hasUserChanges should detect changes in current fields', function () {
        var animal = new Animal_1.Animal({ id: 1 });
        expect(animal.hasUserChanges).toBe(false);
        animal.setInput('name', 'Lino');
        expect(animal.hasUserChanges).toBe(true);
    });
    test('hasUserChanges should detect changes in model relations', function () {
        var animal = new Animal_1.Animal({ id: 1 }, { relations: ['kind.breed'] });
        expect(animal.hasUserChanges).toBe(false);
        // @ts-ignore
        animal.kind.breed.setInput('name', 'Katachtige');
        expect(animal.hasUserChanges).toBe(true);
    });
    test('hasUserChanges should detect changes in store relations', function () {
        var animal = new Animal_1.Animal(
        // @ts-ignore
        { id: 1, pastOwners: [{ id: 1 }] }, { relations: ['pastOwners'] });
        expect(animal.hasUserChanges).toBe(false);
        // @ts-ignore
        animal.pastOwners.at(0).setInput('name', 'Henk');
        expect(animal.hasUserChanges).toBe(true);
    });
});
