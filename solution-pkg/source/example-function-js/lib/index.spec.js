'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const expect = require('chai').expect;
const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lib = require('./index.js');
const Hello = require('./hello.js');

let sandbox;

describe('Index', function() {

    beforeEach(function() {
        sandbox = sinon.createSandbox();
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should return greeting with successful library Hello respond response', function(done) {

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

        let _resp = { data: `Hello, ${_event.name}! How are you?`};

        sandbox.stub(Hello.prototype, 'respond').resolves(_resp);

        lib.process(_event, options).then((resp) => {
            expect(resp).to.have.property('data');
            expect(resp.data).to.equal(`Hello, ${_event.name}! How are you?`);
            done();
        }).catch((err) => {
            done(err)
        });
    });

    it('should return error with failed library Hello respond response', function(done) {

        const _event = {
            "name": "John Doe",
            "message": "Hey, are you there?"
        }

        let _resp = { err: `Error occurred`};

        const options = {
            logger: {
                log: function(m) {
                    console.log(m);
                }
            }
        }

        sandbox.stub(Hello.prototype, 'respond').rejects(_resp);

        lib.process(_event, options).then((resp) => {
            done('invalid failure for negative test');
        }).catch((err) => {
            expect(err).to.deep.equal(_resp);
            done();
        });
    });

});