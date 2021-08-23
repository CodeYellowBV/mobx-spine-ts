"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerStore = exports.Customer = exports.LocationStore = exports.Location = exports.Cook = exports.RestaurantStore = exports.Restaurant = void 0;
const mobx_1 = require("mobx");
const Model_1 = require("../../Model");
const Store_1 = require("../../Store");
const BinderApi_1 = require("../../BinderApi");
let Restaurant = class Restaurant extends Model_1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            chef: Cook,
            customers: CustomerStore,
            favouriteCustomers: CustomerStore
        };
    }
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
exports.Restaurant = Restaurant;
class RestaurantStore extends Store_1.Store {
    constructor() {
        super(...arguments);
        this.Model = Restaurant;
    }
}
exports.RestaurantStore = RestaurantStore;
let Cook = class Cook extends Model_1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
        this.profession = 'chef';
    }
    relations() {
        return {
            currentWork: Restaurant,
            workPlaces: RestaurantStore
        };
    }
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
exports.Cook = Cook;
let Location = class Location extends Model_1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            restaurants: RestaurantStore,
            bestCook: Cook,
        };
    }
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
exports.Location = Location;
class LocationStore extends Store_1.Store {
    constructor() {
        super(...arguments);
        this.Model = Location;
    }
}
exports.LocationStore = LocationStore;
let Customer = class Customer extends Model_1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            town: Location,
            oldTowns: LocationStore,
            favouriteRestaurant: Restaurant,
        };
    }
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
exports.Customer = Customer;
class CustomerStore extends Store_1.Store {
    constructor() {
        super(...arguments);
        this.Model = Customer;
        this.api = new BinderApi_1.BinderApi();
        this.url = '/api/human/';
    }
}
exports.CustomerStore = CustomerStore;
