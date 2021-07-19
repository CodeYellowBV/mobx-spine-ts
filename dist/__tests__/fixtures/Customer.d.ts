import { Model } from "../../Model";
import { Store } from "../../Store";
import { BinderApi } from "../../BinderApi";
declare type RestaurantData = {
    id?: number;
    name?: string;
};
export declare class Restaurant extends Model<RestaurantData> {
    id: any;
    name: string;
    relations(): {
        chef: typeof Cook;
        customers: typeof CustomerStore;
        favouriteCustomers: typeof CustomerStore;
    };
}
export declare class RestaurantStore extends Store<RestaurantData, Restaurant> {
    Model: typeof Restaurant;
}
declare type CookData = {
    id?: number;
    name?: string;
    profession?: string;
};
export declare class Cook extends Model<CookData> implements CookData {
    id: any;
    name: string;
    profession: string;
    relations(): {
        currentWork: typeof Restaurant;
        workPlaces: typeof RestaurantStore;
    };
}
declare type LocationData = {
    id?: number;
    name?: string;
    bestCook?: CookData;
};
export declare class Location extends Model<LocationData> implements LocationData {
    id: any;
    name: string;
    relations(): {
        restaurants: typeof RestaurantStore;
        bestCook: typeof Cook;
    };
}
export declare class LocationStore extends Store<LocationData, Location> {
    Model: typeof Location;
}
declare type CustomerData = {
    id?: number;
    name?: string;
};
export declare class Customer extends Model<CustomerData> implements CustomerData {
    id: any;
    name: string;
    relations(): {
        town: typeof Location;
        oldTowns: typeof LocationStore;
        favouriteRestaurant: typeof Restaurant;
    };
}
export declare class CustomerStore extends Store<CustomerData, Customer> {
    Model: typeof Customer;
    api: BinderApi;
    url: string;
}
export {};
