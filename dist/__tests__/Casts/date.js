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
var moment_1 = __importDefault(require("moment"));
var Animal = /** @class */ (function (_super) {
    __extends(Animal, _super);
    function Animal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.birthDate = null;
        return _this;
    }
    Animal.prototype.casts = function () {
        return {
            birthDate: __1.Casts.date,
        };
    };
    __decorate([
        mobx_1.observable
    ], Animal.prototype, "birthDate", void 0);
    Animal = __decorate([
        __1.tsPatch
    ], Animal);
    return Animal;
}(__1.Model));
test('should parse to model', function () {
    var animal = new Animal();
    expect(animal.birthDate).toBe(null);
    animal.parse({
        birthDate: '1995-03-22',
    });
    expect(animal.birthDate).toBeInstanceOf(moment_1.default);
    expect(animal.birthDate.format('YYYY-MM-DD')).toBe('1995-03-22');
});
test('parse should treat undefined as null', function () {
    var animal = new Animal({ birthDate: '1995-03-22' });
    expect(animal.birthDate).toBeInstanceOf(moment_1.default);
    animal.parse({
        birthDate: undefined,
    });
    expect(animal.birthDate).toBe(null);
});
test('toJS should treat undefined as null', function () {
    var animal = new Animal({ birthDate: '1995-03-22' });
    animal.birthDate = undefined;
    expect(animal.toJS().birthDate).toBe(null);
});
test('should parse to model when null', function () {
    var animal = new Animal({ birthDate: '1995-03-22' });
    expect(animal.birthDate).toBeInstanceOf(moment_1.default);
    animal.parse({
        birthDate: null,
    });
    expect(animal.birthDate).toBe(null);
});
test('parse() should throw away time info', function () {
    var animal = new Animal({ birthDate: '2017-03-22T22:08:23+00:00' });
    expect(animal.birthDate.format('YYYY-MM-DD')).toBe('2017-03-22');
});
test('should be serialized in toJS()', function () {
    var animal = new Animal({ birthDate: '1995-03-22' });
    expect(animal.toJS()).toEqual({
        birthDate: '1995-03-22',
    });
});
test('should be serialized in toJS()', function () {
    var animal = new Animal();
    expect(animal.toJS()).toEqual({
        birthDate: null,
    });
});
test('toJS() should throw error when moment instance is gone', function () {
    var animal = new Animal({ birthDate: '1995-03-22' });
    // We need ts-ignore for this test because this isn't valid TypeScript, but it could still
    // occur due to the crazy ways of JavaScript.
    // @ts-ignore
    animal.birthDate = 'asdf';
    expect(function () {
        return animal.toJS();
    }).toThrow("[mobx-spine] Attribute 'birthDate' is not a moment instance.");
});
