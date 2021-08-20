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
exports.CustomerStore = exports.Customer = exports.LocationStore = exports.Location = exports.Cook = exports.RestaurantStore = exports.Restaurant = void 0;
var mobx_1 = require("mobx");
var Model_1 = require("../../Model");
var Store_1 = require("../../Store");
var BinderApi_1 = require("../../BinderApi");
var Restaurant = /** @class */ (function (_super) {
    __extends(Restaurant, _super);
    function Restaurant() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Restaurant.prototype.relations = function () {
        return {
            chef: Cook,
            customers: CustomerStore,
            favouriteCustomers: CustomerStore
        };
    };
    __decorate([
        mobx_1.observable
    ], Restaurant.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Restaurant.prototype, "name", void 0);
    Restaurant = __decorate([
        Model_1.tsPatch
    ], Restaurant);
    return Restaurant;
}(Model_1.Model));
exports.Restaurant = Restaurant;
var RestaurantStore = /** @class */ (function (_super) {
    __extends(RestaurantStore, _super);
    function RestaurantStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Restaurant;
        return _this;
    }
    return RestaurantStore;
}(Store_1.Store));
exports.RestaurantStore = RestaurantStore;
var Cook = /** @class */ (function (_super) {
    __extends(Cook, _super);
    function Cook() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        _this.profession = 'chef';
        return _this;
    }
    Cook.prototype.relations = function () {
        return {
            currentWork: Restaurant,
            workPlaces: RestaurantStore
        };
    };
    __decorate([
        mobx_1.observable
    ], Cook.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Cook.prototype, "name", void 0);
    __decorate([
        mobx_1.observable
    ], Cook.prototype, "profession", void 0);
    Cook = __decorate([
        Model_1.tsPatch
    ], Cook);
    return Cook;
}(Model_1.Model));
exports.Cook = Cook;
var Location = /** @class */ (function (_super) {
    __extends(Location, _super);
    function Location() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Location.prototype.relations = function () {
        return {
            restaurants: RestaurantStore,
            bestCook: Cook,
        };
    };
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
}(Model_1.Model));
exports.Location = Location;
var LocationStore = /** @class */ (function (_super) {
    __extends(LocationStore, _super);
    function LocationStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Location;
        return _this;
    }
    return LocationStore;
}(Store_1.Store));
exports.LocationStore = LocationStore;
var Customer = /** @class */ (function (_super) {
    __extends(Customer, _super);
    function Customer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = null;
        _this.name = '';
        return _this;
    }
    Customer.prototype.relations = function () {
        return {
            town: Location,
            oldTowns: LocationStore,
            favouriteRestaurant: Restaurant,
        };
    };
    __decorate([
        mobx_1.observable
    ], Customer.prototype, "id", void 0);
    __decorate([
        mobx_1.observable
    ], Customer.prototype, "name", void 0);
    Customer = __decorate([
        Model_1.tsPatch
    ], Customer);
    return Customer;
}(Model_1.Model));
exports.Customer = Customer;
var CustomerStore = /** @class */ (function (_super) {
    __extends(CustomerStore, _super);
    function CustomerStore() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.Model = Customer;
        _this.api = new BinderApi_1.BinderApi();
        _this.url = '/api/human/';
        return _this;
    }
    return CustomerStore;
}(Store_1.Store));
exports.CustomerStore = CustomerStore;
