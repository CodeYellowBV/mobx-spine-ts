import {observable} from 'mobx';
import {Model, Store, BinderApi} from '../..';
import {ModelOptions} from "../../Model";
//
// export class Location extends Model {
//     static backendResourceName = 'location';
//     @observable id = null;
//     @observable name = '';
// }
//
// export class Breed extends Model {
//     @observable id = null;
//     @observable name = '';
//
//     relations() {
//         return {
//             location: Location,
//         };
//     }
// }
//
// export class Person extends Model {
//     static backendResourceName = 'person';
//     api = new BinderApi();
//     @observable id = null;
//     @observable name = '';
//
//     relations() {
//         return {
//             town: Location,
//             pets: AnimalStore,
//         };
//     }
// }
//
// export class PersonStore extends Store {
//     Model = Person;
// }
//
// export class Kind extends Model {
//     static backendResourceName = 'kind';
//     @observable id = null;
//     @observable name = '';
//
//     relations() {
//         return {
//             breed: Breed,
//             location: Location,
//         };
//     }
// }
//

interface AnimalData {
    id: number;
    name: string;
}

export class Animal extends Model<AnimalData> {
    static backendResourceName = 'animal';

    urlRoot = '/api/animal/';
    api = new BinderApi();

    @observable id = null;
    @observable name = '';
    //
    // constructor(data?: AnimalData, options?: ModelOptions) {
    //     super(data, options);
    //
    // }

    relations() {
        return {
            // kind: Kind,
            // owner: Person,
            // pastOwners: PersonStore,
        };
    }
}

//
// export class AnimalStore extends Store {
//     Model = Animal;
//     api = new BinderApi();
//     url = '/api/animal/';
// }
//
// export class AnimalStoreWithUrlFunction extends Store {
//     Model = Animal;
//     api = new BinderApi();
//     randomId = 1;
//     url() {
//         return `/api/animal/${this.randomId}/`;
//     }
// }
//
// // I have no creativity left after 17h, sorry. Also ssssh.
// export class AnimalWithArray extends Model {
//     @observable foo = [];
// }
//
// export class AnimalWithObject extends Model {
//     @observable foo = {};
// }
//
// export class AnimalWithFrontendProp extends Model {
//     @observable id = null;
//     @observable _frontend = null;
// }
//
// export class AnimalWithoutApi extends Model {
//     @observable id = null;
// }
//
// export class AnimalStoreWithoutApi extends Store {
//     Model = Animal;
// }
//
// export class AnimalWithoutUrl extends Model {
//     api = new BinderApi();
//     @observable id = null;
// }
//
// export class AnimalStoreWithoutUrl extends Store {
//     api = new BinderApi();
//     Model = Animal;
// }
//
// export class AnimalCircular extends Model {
//     @observable id = null;
//
//     relations() {
//         return {
//             circular: AnimalCircular,
//         };
//     }
// }
//
// export class KindResourceName extends Model {
//     api = new BinderApi();
//     static backendResourceName = 'kind';
//     @observable id = null;
// }
//
// export class PersonStoreResourceName extends Store {
//     Model = KindResourceName;
//     static backendResourceName = 'person';
//     api = new BinderApi();
// }
//
// export class AnimalResourceName extends Model {
//     api = new BinderApi();
//     @observable id = null;
//
//     relations() {
//         return {
//             blaat: KindResourceName,
//             owners: PersonStoreResourceName,
//             pastOwners: PersonStoreResourceName,
//         };
//     }
// }