import fs from 'fs';

test('can read csv', () => {
    const f = fs.readFileSync('./doc/price.csv');
    expect(f.toString().length).not.toBe(0);
});