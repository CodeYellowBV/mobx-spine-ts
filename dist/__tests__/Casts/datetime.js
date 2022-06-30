"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../../");
const mobx_1 = require("mobx");
const luxon_1 = require("luxon");
const moment_1 = __importDefault(require("moment"));
const moment_with_locales_1 = __importDefault(require("moment/min/moment-with-locales"));
let Animal = class Animal extends __1.Model {
    constructor() {
        super(...arguments);
        this.bornAt = null;
    }
    casts() {
        return {
            bornAt: __1.Casts.datetime,
        };
    }
};
__decorate([
    mobx_1.observable
], Animal.prototype, "bornAt", void 0);
Animal = __decorate([
    __1.tsPatch
], Animal);
// Unfortunately we can't check the whole datetime because the CI has a different timezone so that fucks things up.
// I should really fix this but I really don't want to. Do you? Fuck timezones.
test('should parse to model', () => {
    const animal = new Animal();
    expect(animal.bornAt).toBe(null);
    animal.parse({
        bornAt: '2017-03-22T22:08:23',
    });
    expect(animal.bornAt).toBeInstanceOf(moment_1.default);
    expect(animal.bornAt.format()).toEqual(expect.stringContaining('2017-03-22T'));
});
test('should parse to model when null', () => {
    const animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    expect(animal.bornAt).toBeInstanceOf(moment_1.default);
    animal.parse({
        bornAt: null,
    });
    expect(animal.bornAt).toBe(null);
});
test('should be serialized in toJS()', () => {
    const animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    expect(animal.toJS().bornAt).toEqual(expect.stringContaining('2017-03-22'));
});
test('should be serialized in toJS() when null', () => {
    const animal = new Animal();
    expect(animal.toJS()).toEqual({
        bornAt: null,
    });
});
test('toJS() should throw error when moment instance is gone', () => {
    const animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    // @ts-ignore
    animal.bornAt = 'asdf';
    expect(() => {
        return animal.toJS();
    }).toThrow("[mobx-spine] Attribute 'bornAt' is not a moment instance.");
});
test('should be serialized in toBackend()', () => {
    const animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    expect(animal.toBackend()['born_at']).toEqual(expect.stringContaining('2017-03-22'));
});
test('moment instance with locale should be recognized', () => {
    const animal = new Animal();
    animal.bornAt = (0, moment_with_locales_1.default)('2017-03-22T22:08:23+00:00');
    expect(animal.toJS().bornAt).toEqual(expect.stringContaining('2017-03-22'));
});
describe('luxon compatibility', () => {
    luxon_1.Settings.defaultZoneName = 'utc';
    let LuxonAnimal = class LuxonAnimal extends Animal {
        constructor() {
            super(...arguments);
            this.createdAt = null;
        }
        casts() {
            return {
                bornAt: __1.Casts.luxonDatetime,
            };
        }
    };
    __decorate([
        mobx_1.observable
    ], LuxonAnimal.prototype, "createdAt", void 0);
    LuxonAnimal = __decorate([
        __1.tsPatch
    ], LuxonAnimal);
    ;
    test('toJS() should throw error when luxon instance is gone', () => {
        const animal = new LuxonAnimal({ bornAt: '2017-03-22T22:08:23+00:00' });
        // @ts-ignore
        animal.bornAt = 'asdf';
        expect(() => {
            return animal.toJS();
        }).toThrow("[mobx-spine] Attribute 'bornAt' is not a luxon instance.");
    });
    test('should be serialized in toBackend()', () => {
        const animal = new LuxonAnimal({ bornAt: '2017-03-22T22:08:23+00:00' });
        expect(animal.toBackend()['born_at']).toEqual('2017-03-22T22:08:23+00:00');
    });
    test('should be serialized in toBackend() when given a binder specific format', () => {
        const animal = new LuxonAnimal({ bornAt: '2017-03-22T22:08:23.575242+0000' });
        expect(animal.toBackend()['born_at']).toEqual('2017-03-22T22:08:23+00:00');
    });
});
