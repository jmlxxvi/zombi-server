/* 
    This class is used to sort the tests and control the order they run
    It is configured on jest.config.js as testSequencer
*/
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
    sort(tests) {
        // Test structure information
        // https://github.com/facebook/jest/blob/6b8b1404a1d9254e7d5d90a8934087a9c9899dab/packages/jest-runner/src/types.ts#L17-L21
        const copy_tests = Array.from(tests);

        const ordered_tests = copy_tests.reduce((acc, element) => {

            const file_name = element.path.substring(element.path.lastIndexOf('/') + 1);

            if (file_name === "api.test.ts") {
                return [element, ...acc];
            }
            return [...acc, element];
        }, []);

        // return copy_tests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));

        return ordered_tests;
    }
}

module.exports = CustomSequencer;