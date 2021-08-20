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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimalResourceName = exports.PersonStoreResourceName = exports.KindResourceName = exports.AnimalCircular = exports.AnimalStoreWithoutUrl = exports.AnimalWithoutUrl = exports.AnimalStoreWithoutApi = exports.AnimalWithoutApi = exports.AnimalWithFrontendProp = exports.AnimalWithObject = exports.AnimalWithArray = exports.AnimalStoreWithUrlFunction = exports.AnimalStore = exports.Animal = exports.Kind = exports.PersonStore = exports.Person = exports.Breed = exports.Location = void 0;
var mobx_1 = require("mobx");
var __1 = require("../..");
var Model_1 = require("../../Model");
var Location = /** @class */ (function (_super) {
    __extends(Location, _super);
    function Location() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Location.backendResourceName = 'location';
    __decorate([
        mobx_1.observable
    ], Location.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Location.prototype, "name", void 0);
    Location = __decorate([
        Model_1.tsPatch
    ], Location);
    return Location;
}(__1.Model));
exports.Location = Location;
var Breed = /** @class */ (function (_super) {
    __extends(Breed, _super);
    function Breed() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Breed.prototype.relations = function () {
        return {
            location: Location,
        };
    };
    __decorate([
        mobx_1.observable
    ], Breed.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Breed.prototype, "name", void 0);
    Breed = __decorate([
        Model_1.tsPatch
    ], Breed);
    return Breed;
}(__1.Model));
exports.Breed = Breed;
var Person = /** @class */ (function (_super) {
    __extends(Person, _super);
    function Person() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.api = new __1.BinderApi();
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Person.prototype.relations = function () {
        return {
            town: Location,
            pets: AnimalStore,
        };
    };
    Person.backendResourceName = 'person';
    __decorate([
        mobx_1.observable
    ], Person.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Person.prototype, "name", void 0);
    Person = __decorate([
        Model_1.tsPatch
    ], Person);
    return Person;
}(__1.Model));
exports.Person = Person;
var PersonStore = /** @class */ (function (_super) {
    __extends(PersonStore, _super);
    function PersonStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Person;
        return _this;
    }
    return PersonStore;
}(__1.Store));
exports.PersonStore = PersonStore;
var Kind = /** @class */ (function (_super) {
    __extends(Kind, _super);
    function Kind() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Kind.prototype.relations = function () {
        return {
            breed: Breed,
            location: Location,
        };
    };
    Kind.backendResourceName = 'kind';
    __decorate([
        mobx_1.observable
    ], Kind.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Kind.prototype, "name", void 0);
    Kind = __decorate([
        Model_1.tsPatch
    ], Kind);
    return Kind;
}(__1.Model));
exports.Kind = Kind;
var Animal = /** @class */ (function (_super) {
    __extends(Animal, _super);
    function Animal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.urlRoot = '/api/animal/';
        _this.api = new __1.BinderApi();
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Animal.prototype.relations = function () {
        return {
            kind: Kind,
            owner: Person,
            pastOwners: PersonStore,
        };
    };
    Animal.backendResourceName = 'animal';
    __decorate([
        mobx_1.observable
    ], Animal.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Animal.prototype, "name", void 0);
    Animal = __decorate([
        Model_1.tsPatch
    ], Animal);
    return Animal;
}(__1.Model));
exports.Animal = Animal;
var AnimalStore = /** @class */ (function (_super) {
    __extends(AnimalStore, _super);
    function AnimalStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Animal;
        _this.api = new __1.BinderApi();
        _this.url = '/api/animal/';
        return _this;
    }
    return AnimalStore;
}(__1.Store));
exports.AnimalStore = AnimalStore;
var AnimalStoreWithUrlFunction = /** @class */ (function (_super) {
    __extends(AnimalStoreWithUrlFunction, _super);
    function AnimalStoreWithUrlFunction() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Animal;
        _this.api = new __1.BinderApi();
        _this.randomId = 1;
        return _this;
    }
    AnimalStoreWithUrlFunction.prototype.url = function () {
        return "/api/animal/" + this.randomId + "/";
    };
    return AnimalStoreWithUrlFunction;
}(__1.Store));
exports.AnimalStoreWithUrlFunction = AnimalStoreWithUrlFunction;
// I have no creativity left after 17h, sorry. Also ssssh.
var AnimalWithArray = /** @class */ (function (_super) {
    __extends(AnimalWithArray, _super);
    function AnimalWithArray() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.foo = [];
        return _this;
    }
    __decorate([
        mobx_1.observable
    ], AnimalWithArray.prototype, "foo", void 0);
    AnimalWithArray = __decorate([
        Model_1.tsPatch
    ], AnimalWithArray);
    return AnimalWithArray;
}(__1.Model));
exports.AnimalWithArray = AnimalWithArray;
var AnimalWithObject = /** @class */ (function (_super) {
    __extends(AnimalWithObject, _super);
    function AnimalWithObject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.foo = {};
        return _this;
    }
    __decorate([
        mobx_1.observable
    ], AnimalWithObject.prototype, "foo", void 0);
    AnimalWithObject = __decorate([
        Model_1.tsPatch
    ], AnimalWithObject);
    return AnimalWithObject;
}(__1.Model));
exports.AnimalWithObject = AnimalWithObject;
var AnimalWithFrontendProp = /** @class */ (function (_super) {
    __extends(AnimalWithFrontendProp, _super);
    function AnimalWithFrontendProp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this._frontend = null;
        return _this;
    }
    __decorate([
        mobx_1.observable
    ], AnimalWithFrontendProp.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], AnimalWithFrontendProp.prototype, "_frontend", void 0);
    AnimalWithFrontendProp = __decorate([
        Model_1.tsPatch
    ], AnimalWithFrontendProp);
    return AnimalWithFrontendProp;
}(__1.Model));
exports.AnimalWithFrontendProp = AnimalWithFrontendProp;
var AnimalWithoutApi = /** @class */ (function (_super) {
    __extends(AnimalWithoutApi, _super);
    function AnimalWithoutApi() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        return _this;
    }
    __decorate([
        mobx_1.observable
    ], AnimalWithoutApi.prototype, "id", void 0);
    AnimalWithoutApi = __decorate([
        Model_1.tsPatch
    ], AnimalWithoutApi);
    return AnimalWithoutApi;
}(__1.Model));
exports.AnimalWithoutApi = AnimalWithoutApi;
var AnimalStoreWithoutApi = /** @class */ (function (_super) {
    __extends(AnimalStoreWithoutApi, _super);
    function AnimalStoreWithoutApi() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Animal;
        return _this;
    }
    return AnimalStoreWithoutApi;
}(__1.Store));
exports.AnimalStoreWithoutApi = AnimalStoreWithoutApi;
var AnimalWithoutUrl = /** @class */ (function (_super) {
    __extends(AnimalWithoutUrl, _super);
    function AnimalWithoutUrl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.api = new __1.BinderApi();
        _this.id = null;
        return _this;
    }
    __decorate([
        mobx_1.observable
    ], AnimalWithoutUrl.prototype, "id", void 0);
    AnimalWithoutUrl = __decorate([
        Model_1.tsPatch
    ], AnimalWithoutUrl);
    return AnimalWithoutUrl;
}(__1.Model));
exports.AnimalWithoutUrl = AnimalWithoutUrl;
var AnimalStoreWithoutUrl = /** @class */ (function (_super) {
    __extends(AnimalStoreWithoutUrl, _super);
    function AnimalStoreWithoutUrl() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.api = new __1.BinderApi();
        _this.Model = Animal;
        return _this;
    }
    return AnimalStoreWithoutUrl;
}(__1.Store));
exports.AnimalStoreWithoutUrl = AnimalStoreWithoutUrl;
var AnimalCircular = /** @class */ (function (_super) {
    __extends(AnimalCircular, _super);
    function AnimalCircular() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        return _this;
    }
    AnimalCircular_1 = AnimalCircular;
    AnimalCircular.prototype.relations = function () {
        return {
            circular: AnimalCircular_1,
        };
    };
    var AnimalCircular_1;
    __decorate([
        mobx_1.observable
    ], AnimalCircular.prototype, "id", void 0);
    AnimalCircular = AnimalCircular_1 = __decorate([
        Model_1.tsPatch
    ], AnimalCircular);
    return AnimalCircular;
}(__1.Model));
exports.AnimalCircular = AnimalCircular;
var KindResourceName = /** @class */ (function (_super) {
    __extends(KindResourceName, _super);
    function KindResourceName() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.api = new __1.BinderApi();
        _this.id = null;
        return _this;
    }
    KindResourceName.backendResourceName = 'kind';
    __decorate([
        mobx_1.observable
    ], KindResourceName.prototype, "id", void 0);
    KindResourceName = __decorate([
        Model_1.tsPatch
    ], KindResourceName);
    return KindResourceName;
}(__1.Model));
exports.KindResourceName = KindResourceName;
var PersonStoreResourceName = /** @class */ (function (_super) {
    __extends(PersonStoreResourceName, _super);
    function PersonStoreResourceName() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Person;
        _this.api = new __1.BinderApi();
        return _this;
    }
    PersonStoreResourceName.backendResourceName = 'person';
    return PersonStoreResourceName;
}(__1.Store));
exports.PersonStoreResourceName = PersonStoreResourceName;
var AnimalResourceName = /** @class */ (function (_super) {
    __extends(AnimalResourceName, _super);
    function AnimalResourceName() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.api = new __1.BinderApi();
        _this.id = null;
        return _this;
    }
    AnimalResourceName.prototype.relations = function () {
        return {
            blaat: KindResourceName,
            owners: PersonStoreResourceName,
            pastOwners: PersonStoreResourceName,
        };
    };
    __decorate([
        mobx_1.observable
    ], AnimalResourceName.prototype, "id", void 0);
    AnimalResourceName = __decorate([
        Model_1.tsPatch
    ], AnimalResourceName);
    return AnimalResourceName;
}(__1.Model));
exports.AnimalResourceName = AnimalResourceName;
