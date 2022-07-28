import * as lodash from 'lodash-es';

export default {
    transform: {
        "\\.[jt]sx?$": "babel-jest"
    },
    testEnvironment: "jsdom",
    globals: {
        _: lodash,
        Cookies: {}
    },
    moduleNameMapper: {
        underscore$: 'lodash-es'
    },
    collectCoverage: true,
    coverageDirectory: ".",
    coverageReporters: ["lcov", "text"]
}

