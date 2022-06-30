import { Model, Store, BinderApi } from '../..';
declare type LocationData = {
    id?: number;
    name?: string;
};
export declare class Location extends Model<LocationData> {
    static backendResourceName: string;
    id: any;
    name: string;
}
declare type FileData = {
    id?: number;
    dataFile?: Blob;
};
export declare class File extends Model<FileData> {
    urlRoot: string;
    api: BinderApi;
    static backendResourceName: string;
    id: any;
    dataFile: any;
}
export declare class FileStore extends Store<FileData, File> {
    Model: typeof File;
}
declare type FileCabinetData = {
    id?: number;
};
export declare class FileCabinet extends Model<FileCabinetData> {
    urlRoot: string;
    api: BinderApi;
    static backendResourceName: string;
    id: any;
    relations(): {
        files: typeof FileStore;
    };
}
declare type BreedData = {
    id?: number;
    name?: string;
};
export declare class Breed extends Model<BreedData> {
    id: any;
    name: string;
    relations(): {
        location: typeof Location;
    };
}
interface PersonData {
    id?: number;
    name?: string;
}
export declare class Person extends Model<PersonData> {
    static backendResourceName: string;
    api: BinderApi;
    id: any;
    name: string;
    relations(): {
        town: typeof Location;
        pets: typeof AnimalStore;
    };
}
export declare class PersonStore extends Store<PersonData, Person> {
    Model: typeof Person;
}
declare type KindData = {
    id?: number;
    name?: string;
    breed?: Breed;
    location?: Location;
};
export declare class Kind extends Model<KindData> {
    static backendResourceName: string;
    id: any;
    name: string;
    relations(): {
        breed: typeof Breed;
        location: typeof Location;
    };
}
interface AnimalData {
    id?: number;
    name?: string;
}
export declare class Animal extends Model<AnimalData> {
    static backendResourceName: string;
    urlRoot: string;
    api: BinderApi;
    id: any;
    name: string;
    relations(): {
        kind: typeof Kind;
        owner: typeof Person;
        pastOwners: typeof PersonStore;
    };
}
export declare class AnimalStore extends Store<AnimalData, Animal> {
    Model: typeof Animal;
    api: BinderApi;
    url: string;
}
export declare class AnimalStoreWithUrlFunction extends Store<AnimalData, Animal> {
    Model: typeof Animal;
    api: BinderApi;
    randomId: number;
    url(): string;
}
interface AnimalArrayData {
    id?: number;
    foo?: string[];
}
export declare class AnimalWithArray extends Model<AnimalArrayData> {
    foo: any[];
}
interface AnimalObjectData {
    id?: number;
    foo?: object;
}
export declare class AnimalWithObject extends Model<AnimalObjectData> {
    foo: object;
}
interface AnimalFrontendData {
    id?: number;
    _frontend?: string;
}
export declare class AnimalWithFrontendProp extends Model<AnimalFrontendData> {
    id: any;
    _frontend: any;
}
export declare class AnimalWithoutApi extends Model<{
    id?: number;
}> {
    id: any;
}
export declare class AnimalStoreWithoutApi extends Store<AnimalData, Animal> {
    Model: typeof Animal;
}
export declare class AnimalWithoutUrl extends Model<{
    id?: number;
}> {
    api: BinderApi;
    id: any;
}
export declare class AnimalStoreWithoutUrl extends Store<AnimalData, Animal> {
    api: BinderApi;
    Model: typeof Animal;
}
interface AnimalCircularData {
    id?: number;
    circular?: AnimalCircularData;
}
export declare class AnimalCircular extends Model<AnimalCircularData> {
    id: any;
    relations(): {
        circular: typeof AnimalCircular;
    };
}
declare type KindResourceData = {
    id?: number;
};
export declare class KindResourceName extends Model<KindResourceData> {
    api: BinderApi;
    static backendResourceName: string;
    id: any;
}
export declare class PersonStoreResourceName extends Store<PersonData, Person> {
    Model: typeof Person;
    static backendResourceName: string;
    api: BinderApi;
}
export declare class AnimalResourceName extends Model<{}> {
    api: BinderApi;
    id: any;
    relations(): {
        blaat: typeof KindResourceName;
        owners: typeof PersonStoreResourceName;
        pastOwners: typeof PersonStoreResourceName;
    };
}
export {};
