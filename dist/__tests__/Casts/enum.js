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
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../../");
var mobx_1 = require("mobx");
var Animal = /** @class */ (function (_super) {
    __extends(Animal, _super);
    function Animal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.status = null;
        return _this;
    }
    Animal.prototype.casts = function () {
        return {
            status: __1.Casts.enum(['active', 'overdue']),
        };
    };
    __decorate([
        mobx_1.observable
    ], Animal.prototype, "status", void 0);
    Animal = __decorate([
        __1.tsPatch
    ], Animal);
    return Animal;
}(__1.Model));
test('should parse to model', function () {
    var animal = new Animal();
    expect(animal.status).toBe(null);
    animal.parse({
        status: 'active',
    });
    expect(animal.status).toBe('active');
});
test('should parse to model when null', function () {
    var animal = new Animal();
    animal.parse({
        status: null,
    });
    expect(animal.status).toBe(null);
});
test('parse() should throw error when invalid enum is used', function () {
    expect(function () {
        return new Animal({ status: 'foo' });
    }).toThrow('Value set to attribute \'status\', "foo", is not one of the allowed enum: ["active","overdue"]');
});
test('should be serialized in toJS()', function () {
    var animal = new Animal({ status: 'active' });
    expect(animal.toJS()).toEqual({
        status: 'active',
    });
});
test('should be serialized in toJS() when null', function () {
    var animal = new Animal({ status: 'active' });
    animal.parse({ status: null });
    expect(animal.toJS()).toEqual({
        status: null,
    });
});
test('toJS() should throw error when invalid enum is used', function () {
    var animal = new Animal();
    animal.status = 'blaat';
    expect(function () {
        return animal.toJS();
    }).toThrow('Value set to attribute \'status\', "blaat", is not one of the allowed enum: ["active","overdue"]');
});
// The following is no longer checked because this is a compile error in TypeScript
// @tsPatch
// class AnimalInvalid extends Model<AnimalData> {
//     @observable status = null;
//     casts() {
//         return {
//             status: Casts.enum('asdf'),
//         };
//     }
// }
// test('should throw error when no array is given', () => {
//     expect(() => {
//         return new AnimalInvalid({ status: 'asdf' });
//     }).toThrow(
//         'Invalid argument suplied to `Casts.enum`, expected an instance of array.'
//     );
// });
