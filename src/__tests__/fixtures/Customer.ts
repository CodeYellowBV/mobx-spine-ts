import {observable} from "mobx";
import {Model, tsPatch} from "../../Model";
import {Store} from "../../Store";
import {BinderApi} from "../../BinderApi";


type RestaurantData = {
    id?: number,
    name?: string

}

@tsPatch
export class Restaurant extends Model<RestaurantData> {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            chef: Cook,
            customers: CustomerStore,
            favouriteCustomers: CustomerStore
        };
    }
}

export class RestaurantStore extends Store<RestaurantData, Restaurant> {
    Model = Restaurant
}

type CookData = {
    id?: number,
    name?: string,
    profession?: string
}

@tsPatch
export class Cook extends Model<CookData> implements CookData {
    @observable id = null;
    @observable name = '';
    @observable profession = 'chef';

    relations() {
        return {
            currentWork: Restaurant,
            workPlaces: RestaurantStore
        };
    }
}

type LocationData = {
    id?: number,
    name?: string,
    bestCook?: CookData
}

@tsPatch
export class Location extends Model<LocationData> implements LocationData {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            restaurants: RestaurantStore,
            bestCook: Cook,
        };
    }
}

export class LocationStore extends Store<LocationData, Location> {
    Model = Location;
}


type CustomerData = {
    id?: number,
    name?: string
}

@tsPatch
export class Customer extends Model<CustomerData> implements CustomerData {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            town: Location,
            oldTowns: LocationStore,
            favouriteRestaurant: Restaurant,
        };
    }
}

export class CustomerStore extends Store<CustomerData, Customer> {
    Model = Customer;
    api = new BinderApi();
    url = '/api/human/';
}
