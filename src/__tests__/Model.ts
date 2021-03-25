import {Animal} from "./fixtures/Animal";
import _ from 'lodash';


beforeEach(() => {
    // Refresh lodash's `_.uniqueId` internal state for every test
    let idCounter = 0;
    // _.uniqueId = jest.fn(() => {
    //     idCounter += 1;
    //     return idCounter;
    // });
});

test('Initialize model with valid data', () => {
    const animal = new Animal({
        id: 2,
        name: 'Monkey',
    });

    debugger;

    expect(animal.id).toBe(2);
    expect(animal.name).toBe('Monkey');
});