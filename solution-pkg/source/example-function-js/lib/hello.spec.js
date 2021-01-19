'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const expect = require('chai').expect;
const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const Hello = require('./hello.js');

let sandbox;

const _event = {
    "name": "John Doe",
    "message": "Hey, are you there?"
}

const options = {
    logger: {
        log: function(m) {
            console.log(m);
        }
    }
}

describe('Hello', function() {

    beforeEach(function() {
        sandbox = sinon.createSandbox();
        let _resp = { data: `Hello, ${_event.name}! How are you?`};
        sandbox.stub(Hello.prototype, 'respond').resolves(_resp);
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should return greeting with successful library Hello respond response', function(done) {

        const hello = new Hello(options);
        hello.respond(_event).then((resp) => {
            expect(resp).to.have.property('data');
            expect(resp.data).to.equal(`Hello, ${_event.name}! How are you?`);
            done();
        }).catch((err) => {
            done(err)
        });
    });

});