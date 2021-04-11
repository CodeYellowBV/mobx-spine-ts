import {observable} from "mobx";
import {Model, tsPatch} from "../../Model";


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
        };
    }
}

type CookData = {
    id?: number,
    name?: string,
    profession?: string
}

@tsPatch
export class Cook extends Model<CookData> implements CookData{
    @observable id = null;
    @observable name = '';
    @observable profession = 'chef';

    relations() {
        return {
            currentWork: Restaurant,
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
            bestCook: Cook,
        };
    }
}