import {observable} from 'mobx';
import {Model, Store, BinderApi} from '../..';
import {tsPatch} from "../../Model";

type LocationData = {
    id?: number,
    name?: string
}

@tsPatch
export class Location extends Model<LocationData> {
    static backendResourceName = 'location';
    @observable id = null;
    @observable name = '';
}


type BreedData = {
    id?: number,
    name?: string
}

@tsPatch
export class Breed extends Model<BreedData> {
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            location: Location,
        };
    }
}

interface PersonData {
    id?: number,
    name?: string
}

@tsPatch
export class Person extends Model<PersonData> {
    static backendResourceName = 'person';
    api = new BinderApi();
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            town: Location,
            // pets: AnimalStore,
        };
    }
}

export class PersonStore extends Store<PersonData, Person> {
    Model = Person;
}


type KindData = {
    id?: number;
    name?: string,
    breed?: Breed,
    location?: Location
}

@tsPatch
export class Kind extends Model<KindData> {
    static backendResourceName = 'kind';
    @observable id = null;
    @observable name = '';

    relations() {
        return {
            breed: Breed,
            location: Location,
        };
    }
}


interface AnimalData {
    id?: number;
    name?: string;
}

@tsPatch
export class Animal extends Model<AnimalData> {
    static backendResourceName = 'animal';

    urlRoot = '/api/animal/';
    api = new BinderApi();

    @observable id = null;
    @observable name = '';

    relations() {
        return {
            kind: Kind,
            owner: Person,
            pastOwners: PersonStore,
        };
    }
}


export class AnimalStore extends Store<AnimalData, Animal> {
    Model = Animal;
    api = new BinderApi();
    url = '/api/animal/';
}

export class AnimalStoreWithUrlFunction extends Store<AnimalData, Animal> {
    Model = Animal;
    api = new BinderApi();
    randomId = 1;
    url() {
        return `/api/animal/${this.randomId}/`;
    }
}

interface AnimalArrayData {
    id?: number;
    foo?: string[];
}

// I have no creativity left after 17h, sorry. Also ssssh.
@tsPatch
export class AnimalWithArray extends Model<AnimalArrayData> {
    @observable foo = [];
}

interface AnimalObjectData {
    id?: number;
    foo?: object;
}
@tsPatch
export class AnimalWithObject extends Model<AnimalObjectData> {
    @observable foo: object = {};
}

interface AnimalFrontendData {
    id?: number;
    _frontend?: string;
}
@tsPatch
export class AnimalWithFrontendProp extends Model<AnimalFrontendData> {
    @observable id = null;
    @observable _frontend = null;
}

@tsPatch
export class AnimalWithoutApi extends Model<{ id?: number}> {
    @observable id = null;
}

export class AnimalStoreWithoutApi extends Store<AnimalData, Animal> {
    Model = Animal;
}

@tsPatch
export class AnimalWithoutUrl extends Model<{ id?: number }> {
    api = new BinderApi();
    @observable id = null;
}

export class AnimalStoreWithoutUrl extends Store<AnimalData, Animal> {
    api = new BinderApi();
    Model = Animal;
}

interface AnimalCircularData {
    id?: number,
    circular?: AnimalCircularData
}

@tsPatch
export class AnimalCircular extends Model<AnimalCircularData> {
    @observable id = null;

    relations() {
        return {
            circular: AnimalCircular,
        };
    }
}


type KindResourceData = {
    id?: number
}

@tsPatch
export class KindResourceName extends Model<KindResourceData> {
    api = new BinderApi();
    static backendResourceName = 'kind';
    @observable id = null;
}

export class PersonStoreResourceName extends Store<PersonData, Person> {
    Model = KindResourceName;
    static backendResourceName = 'person';
    api = new BinderApi();
}

@tsPatch
export class AnimalResourceName extends Model<{}> {
    api = new BinderApi();
    @observable id = null;

    relations() {
        return {
            blaat: KindResourceName,
            owners: PersonStoreResourceName,
            pastOwners: PersonStoreResourceName,
        };
    }
}