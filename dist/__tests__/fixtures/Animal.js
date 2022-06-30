"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnimalCircular_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimalResourceName = exports.PersonStoreResourceName = exports.KindResourceName = exports.AnimalCircular = exports.AnimalStoreWithoutUrl = exports.AnimalWithoutUrl = exports.AnimalStoreWithoutApi = exports.AnimalWithoutApi = exports.AnimalWithFrontendProp = exports.AnimalWithObject = exports.AnimalWithArray = exports.AnimalStoreWithUrlFunction = exports.AnimalStore = exports.Animal = exports.Kind = exports.PersonStore = exports.Person = exports.Breed = exports.FileCabinet = exports.FileStore = exports.File = exports.Location = void 0;
const mobx_1 = require("mobx");
const __1 = require("../..");
const Model_1 = require("../../Model");
let Location = class Location extends __1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
    }
};
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
exports.Location = Location;
let File = class File extends __1.Model {
    constructor() {
        super(...arguments);
        this.urlRoot = '/api/file/';
        this.api = new __1.BinderApi();
        this.id = null;
        this.dataFile = null;
    }
};
File.backendResourceName = 'file';
__decorate([
    mobx_1.observable
], File.prototype, "id", void 0);
__decorate([
    mobx_1.observable
], File.prototype, "dataFile", void 0);
File = __decorate([
    Model_1.tsPatch
], File);
exports.File = File;
class FileStore extends __1.Store {
    constructor() {
        super(...arguments);
        this.Model = File;
    }
}
exports.FileStore = FileStore;
let FileCabinet = class FileCabinet extends __1.Model {
    constructor() {
        super(...arguments);
        this.urlRoot = '/api/file_cabinet/';
        this.api = new __1.BinderApi();
        this.id = null;
    }
    relations() {
        return {
            files: FileStore,
        };
    }
};
FileCabinet.backendResourceName = 'file_cabinet';
__decorate([
    mobx_1.observable
], FileCabinet.prototype, "id", void 0);
FileCabinet = __decorate([
    Model_1.tsPatch
], FileCabinet);
exports.FileCabinet = FileCabinet;
let Breed = class Breed extends __1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            location: Location,
        };
    }
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
exports.Breed = Breed;
let Person = class Person extends __1.Model {
    constructor() {
        super(...arguments);
        this.api = new __1.BinderApi();
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            town: Location,
            pets: AnimalStore,
        };
    }
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
exports.Person = Person;
class PersonStore extends __1.Store {
    constructor() {
        super(...arguments);
        this.Model = Person;
    }
}
exports.PersonStore = PersonStore;
let Kind = class Kind extends __1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            breed: Breed,
            location: Location,
        };
    }
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
exports.Kind = Kind;
let Animal = class Animal extends __1.Model {
    constructor() {
        super(...arguments);
        this.urlRoot = '/api/animal/';
        this.api = new __1.BinderApi();
        this.id = null;
        this.name = '';
    }
    relations() {
        return {
            kind: Kind,
            owner: Person,
            pastOwners: PersonStore,
        };
    }
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
exports.Animal = Animal;
class AnimalStore extends __1.Store {
    constructor() {
        super(...arguments);
        this.Model = Animal;
        this.api = new __1.BinderApi();
        this.url = '/api/animal/';
    }
}
exports.AnimalStore = AnimalStore;
class AnimalStoreWithUrlFunction extends __1.Store {
    constructor() {
        super(...arguments);
        this.Model = Animal;
        this.api = new __1.BinderApi();
        this.randomId = 1;
    }
    url() {
        return `/api/animal/${this.randomId}/`;
    }
}
exports.AnimalStoreWithUrlFunction = AnimalStoreWithUrlFunction;
// I have no creativity left after 17h, sorry. Also ssssh.
let AnimalWithArray = class AnimalWithArray extends __1.Model {
    constructor() {
        super(...arguments);
        this.foo = [];
    }
};
__decorate([
    mobx_1.observable
], AnimalWithArray.prototype, "foo", void 0);
AnimalWithArray = __decorate([
    Model_1.tsPatch
], AnimalWithArray);
exports.AnimalWithArray = AnimalWithArray;
let AnimalWithObject = class AnimalWithObject extends __1.Model {
    constructor() {
        super(...arguments);
        this.foo = {};
    }
};
__decorate([
    mobx_1.observable
], AnimalWithObject.prototype, "foo", void 0);
AnimalWithObject = __decorate([
    Model_1.tsPatch
], AnimalWithObject);
exports.AnimalWithObject = AnimalWithObject;
let AnimalWithFrontendProp = class AnimalWithFrontendProp extends __1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
        this._frontend = null;
    }
};
__decorate([
    mobx_1.observable
], AnimalWithFrontendProp.prototype, "id", void 0);
__decorate([
    mobx_1.observable
], AnimalWithFrontendProp.prototype, "_frontend", void 0);
AnimalWithFrontendProp = __decorate([
    Model_1.tsPatch
], AnimalWithFrontendProp);
exports.AnimalWithFrontendProp = AnimalWithFrontendProp;
let AnimalWithoutApi = class AnimalWithoutApi extends __1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
    }
};
__decorate([
    mobx_1.observable
], AnimalWithoutApi.prototype, "id", void 0);
AnimalWithoutApi = __decorate([
    Model_1.tsPatch
], AnimalWithoutApi);
exports.AnimalWithoutApi = AnimalWithoutApi;
class AnimalStoreWithoutApi extends __1.Store {
    constructor() {
        super(...arguments);
        this.Model = Animal;
    }
}
exports.AnimalStoreWithoutApi = AnimalStoreWithoutApi;
let AnimalWithoutUrl = class AnimalWithoutUrl extends __1.Model {
    constructor() {
        super(...arguments);
        this.api = new __1.BinderApi();
        this.id = null;
    }
};
__decorate([
    mobx_1.observable
], AnimalWithoutUrl.prototype, "id", void 0);
AnimalWithoutUrl = __decorate([
    Model_1.tsPatch
], AnimalWithoutUrl);
exports.AnimalWithoutUrl = AnimalWithoutUrl;
class AnimalStoreWithoutUrl extends __1.Store {
    constructor() {
        super(...arguments);
        this.api = new __1.BinderApi();
        this.Model = Animal;
    }
}
exports.AnimalStoreWithoutUrl = AnimalStoreWithoutUrl;
let AnimalCircular = AnimalCircular_1 = class AnimalCircular extends __1.Model {
    constructor() {
        super(...arguments);
        this.id = null;
    }
    relations() {
        return {
            circular: AnimalCircular_1,
        };
    }
};
__decorate([
    mobx_1.observable
], AnimalCircular.prototype, "id", void 0);
AnimalCircular = AnimalCircular_1 = __decorate([
    Model_1.tsPatch
], AnimalCircular);
exports.AnimalCircular = AnimalCircular;
let KindResourceName = class KindResourceName extends __1.Model {
    constructor() {
        super(...arguments);
        this.api = new __1.BinderApi();
        this.id = null;
    }
};
KindResourceName.backendResourceName = 'kind';
__decorate([
    mobx_1.observable
], KindResourceName.prototype, "id", void 0);
KindResourceName = __decorate([
    Model_1.tsPatch
], KindResourceName);
exports.KindResourceName = KindResourceName;
class PersonStoreResourceName extends __1.Store {
    constructor() {
        super(...arguments);
        this.Model = Person;
        this.api = new __1.BinderApi();
    }
}
exports.PersonStoreResourceName = PersonStoreResourceName;
PersonStoreResourceName.backendResourceName = 'person';
let AnimalResourceName = class AnimalResourceName extends __1.Model {
    constructor() {
        super(...arguments);
        this.api = new __1.BinderApi();
        this.id = null;
    }
    relations() {
        return {
            blaat: KindResourceName,
            owners: PersonStoreResourceName,
            pastOwners: PersonStoreResourceName,
        };
    }
};
__decorate([
    mobx_1.observable
], AnimalResourceName.prototype, "id", void 0);
AnimalResourceName = __decorate([
    Model_1.tsPatch
], AnimalResourceName);
exports.AnimalResourceName = AnimalResourceName;
