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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../../");
var mobx_1 = require("mobx");
var luxon_1 = require("luxon");
var moment_1 = __importDefault(require("moment"));
var moment_with_locales_1 = __importDefault(require("moment/min/moment-with-locales"));
var Animal = /** @class */ (function (_super) {
    __extends(Animal, _super);
    function Animal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.bornAt = null;
        return _this;
    }
    Animal.prototype.casts = function () {
        return {
            bornAt: __1.Casts.datetime,
        };
    };
    __decorate([
        mobx_1.observable
    ], Animal.prototype, "bornAt", void 0);
    Animal = __decorate([
        __1.tsPatch
    ], Animal);
    return Animal;
}(__1.Model));
// Unfortunately we can't check the whole datetime because the CI has a different timezone so that fucks things up.
// I should really fix this but I really don't want to. Do you? Fuck timezones.
test('should parse to model', function () {
    var animal = new Animal();
    expect(animal.bornAt).toBe(null);
    animal.parse({
        bornAt: '2017-03-22T22:08:23',
    });
    expect(animal.bornAt).toBeInstanceOf(moment_1.default);
    expect(animal.bornAt.format()).toEqual(expect.stringContaining('2017-03-22T'));
});
test('should parse to model when null', function () {
    var animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    expect(animal.bornAt).toBeInstanceOf(moment_1.default);
    animal.parse({
        bornAt: null,
    });
    expect(animal.bornAt).toBe(null);
});
test('should be serialized in toJS()', function () {
    var animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    expect(animal.toJS().bornAt).toEqual(expect.stringContaining('2017-03-22'));
});
test('should be serialized in toJS() when null', function () {
    var animal = new Animal();
    expect(animal.toJS()).toEqual({
        bornAt: null,
    });
});
test('toJS() should throw error when moment instance is gone', function () {
    var animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    // @ts-ignore
    animal.bornAt = 'asdf';
    expect(function () {
        return animal.toJS();
    }).toThrow("[mobx-spine] Attribute 'bornAt' is not a moment instance.");
});
test('should be serialized in toBackend()', function () {
    var animal = new Animal({ bornAt: '2017-03-22T22:08:23+00:00' });
    expect(animal.toBackend()['born_at']).toEqual(expect.stringContaining('2017-03-22'));
});
test('moment instance with locale should be recognized', function () {
    var animal = new Animal();
    animal.bornAt = moment_with_locales_1.default('2017-03-22T22:08:23+00:00');
    expect(animal.toJS().bornAt).toEqual(expect.stringContaining('2017-03-22'));
});
describe('luxon compatibility', function () {
    luxon_1.Settings.defaultZoneName = 'utc';
    var LuxonAnimal = /** @class */ (function (_super) {
        __extends(LuxonAnimal, _super);
        function LuxonAnimal() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.createdAt = null;
            return _this;
        }
        LuxonAnimal.prototype.casts = function () {
            return {
                bornAt: __1.Casts.luxonDatetime,
            };
        };
        __decorate([
            mobx_1.observable
        ], LuxonAnimal.prototype, "createdAt", void 0);
        LuxonAnimal = __decorate([
            __1.tsPatch
        ], LuxonAnimal);
        return LuxonAnimal;
    }(Animal));
    ;
    test('toJS() should throw error when luxon instance is gone', function () {
        var animal = new LuxonAnimal({ bornAt: '2017-03-22T22:08:23+00:00' });
        // @ts-ignore
        animal.bornAt = 'asdf';
        expect(function () {
            return animal.toJS();
        }).toThrow("[mobx-spine] Attribute 'bornAt' is not a luxon instance.");
    });
    test('should be serialized in toBackend()', function () {
        var animal = new LuxonAnimal({ bornAt: '2017-03-22T22:08:23+00:00' });
        expect(animal.toBackend()['born_at']).toEqual('2017-03-22T22:08:23+00:00');
    });
    test('should be serialized in toBackend() when given a binder specific format', function () {
        var animal = new LuxonAnimal({ bornAt: '2017-03-22T22:08:23.575242+0000' });
        expect(animal.toBackend()['born_at']).toEqual('2017-03-22T22:08:23+00:00');
    });
});
