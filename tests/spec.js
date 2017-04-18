'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

chai.use(chaiAsPromised);
const expect = chai.expect;

const BatchInvoker = require('../');

describe('aws-lambda-batch-invoker', () => {
  const TEST_FUNCTION_NAME = 'functionName';
  const TEST_PAYLOAD = { data: 'blah' };
  const TEST_CLIENT_CONTEXT = { context: 'some-context' };
  const TEST_INVOKE_OPTIONS = {
    functionName: TEST_FUNCTION_NAME,
    payloads: [TEST_PAYLOAD],
    clientContext: TEST_CLIENT_CONTEXT
  };

  describe('constructor', () => {
    it('instantiates the invoker', () => {
      return expect(new BatchInvoker())
        .to.have.property('_invoker');
    });

    it('sets the logger', () => {
      return expect(new BatchInvoker({ logger: console }))
        .to.have.property('_logger', console);
    });

    it('sets the defaults', () => {
      return expect(new BatchInvoker({ logger: console }))
        .to.have.property('_options');
    });
  });

  describe('invoke', () => {
    let invoker;
    before(done => {
      invoker = new BatchInvoker();
      this.sandbox = sinon.sandbox.create();
      done();
    });

    beforeEach(done => {
      this.invokeMock = this.sandbox.mock(invoker._invoker)
        .expects('invoke');
      done();
    });

    afterEach(done => {
      this.sandbox.restore();
      this.invokeMock.verify();
      done();
    });

    describe('throws validation error when', () => {
      it('is missing functionName', () => {
        this.invokeMock.never();
        return expect(invoker.invoke({ payloads: TEST_PAYLOAD }))
          .to.be.rejectedWith(Error, /functionName and payloads are required properties of the options parameter/);
      });

      it('is missing payloads', () => {
        this.invokeMock.never();
        return expect(invoker.invoke({ functionName: TEST_FUNCTION_NAME }))
          .to.be.rejectedWith(Error, /functionName and payloads are required properties of the options parameter/);
      });
    });

    const testError = new Error('invocation error');
    const testData = TEST_PAYLOAD;
    const testCBError = new Error('testCB Error');
    const testCBData = { data: 'testCB data'};
    function testCB(err, result) {
      return new Promise((resolve, reject) => {
        if (err) {
          console.error('Ignoring error: ', err);
          reject(testCBError);
          return;
        }
        console.info('Ignoring result: ', result);
        resolve([testCBData]);
      });
    }

    [
      { testCase: 'with no callback', cb: undefined, expectedData: [testData], expectedError: testError },
      { testCase: 'with callback', cb: testCB, expectedData: [testCBData], expectedError: testCBError }
    ].forEach(test => {
      describe(test.testCase, () => {

        describe('throws error when', () => {
          it('should rethrow invocation error', () => {
            this.invokeMock.once()
              .rejects(testError);

            return expect(
              invoker.invoke(TEST_INVOKE_OPTIONS, test.cb)
            )
            .to.be.rejectedWith(test.expectedError);
          });
        });

        describe('succeeds when', () => {
          it('given all parameters', () => {
            this.invokeMock.once().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: TEST_CLIENT_CONTEXT
            }).resolves(testData);

            return expect(
              invoker.invoke(TEST_INVOKE_OPTIONS, test.cb)
            )
            .to.eventually.deep.equal(test.expectedData);
          });

          it('given all parameters and multiple payloads', () => {
            this.invokeMock.twice().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: TEST_CLIENT_CONTEXT
            }).resolves(testData);

            const expectedData = test.cb
              ? test.expectedData
              : test.expectedData.concat( test.expectedData);

            return expect(
              invoker.invoke({ functionName: TEST_FUNCTION_NAME, payloads: [TEST_PAYLOAD, TEST_PAYLOAD], clientContext: TEST_CLIENT_CONTEXT }, test.cb)
            )
            .to.eventually.deep.equal(expectedData);
          });

          it('given all parameters and more payloads than maxConcurrency', () => {
            this.invokeMock.twice().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: TEST_CLIENT_CONTEXT
            }).resolves(testData);

            const expectedData = test.cb
              ? test.expectedData
              : test.expectedData.concat( test.expectedData);

            return expect(
              invoker.invoke({ functionName: TEST_FUNCTION_NAME, payloads: [TEST_PAYLOAD, TEST_PAYLOAD], clientContext: TEST_CLIENT_CONTEXT, options: { maxConcurrency: 1 } }, test.cb)
            )
            .to.eventually.deep.equal(expectedData);
          });

          it('should invoke lambda function correctly when clientContext is not passed', () => {
            this.invokeMock.once().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: undefined
            }).resolves(testData);

            return expect(
              invoker.invoke({ functionName: TEST_FUNCTION_NAME, payloads: TEST_PAYLOAD }, test.cb)
            )
            .to.eventually.deep.equal(test.expectedData);
          });
        });
      });
    });
  });

  describe('invokeAsync', () => {
    let invoker;
    before(done => {
      invoker = new BatchInvoker();
      this.sandbox = sinon.sandbox.create();
      done();
    });

    beforeEach(done => {
      this.invokeMock = this.sandbox.mock(invoker._invoker)
        .expects('invokeAsync');
      done();
    });

    afterEach(done => {
      this.sandbox.restore();
      this.invokeMock.verify();
      done();
    });

    describe('throws validation error when', () => {
      it('is missing functionName', () => {
        this.invokeMock.never();
        return expect(invoker.invokeAsync({ payloads: TEST_PAYLOAD }))
          .to.be.rejectedWith(Error, /functionName and payloads are required properties of the options parameter/);
      });

      it('is missing payloads', () => {
        this.invokeMock.never();
        return expect(invoker.invokeAsync({ functionName: TEST_FUNCTION_NAME }))
          .to.be.rejectedWith(Error, /functionName and payloads are required properties of the options parameter/);
      });
    });

    const testError = new Error('invocation error');
    const testData = TEST_PAYLOAD;
    const testCBError = new Error('testCB Error');
    const testCBData = { data: 'testCB data'};
    function testCB(err, result) {
      return new Promise((resolve, reject) => {
        if (err) {
          console.error('Ignoring error: ', err);
          reject(testCBError);
          return;
        }
        console.info('Ignoring result: ', result);
        resolve([testCBData]);
      });
    }

    [
      { testCase: 'with no callback', cb: undefined, expectedData: [testData], expectedError: testError },
      { testCase: 'with callback', cb: testCB, expectedData: [testCBData], expectedError: testCBError }
    ].forEach(test => {
      describe(test.testCase, () => {

        describe('throws error when', () => {
          it('should rethrow invocation error', () => {
            this.invokeMock.once()
              .rejects(testError);

            return expect(
              invoker.invokeAsync(TEST_INVOKE_OPTIONS, test.cb)
            )
            .to.be.rejectedWith(test.expectedError);
          });
        });

        describe('succeeds when', () => {
          it('given all parameters', () => {
            this.invokeMock.once().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: TEST_CLIENT_CONTEXT
            }).resolves(testData);

            return expect(
              invoker.invokeAsync(TEST_INVOKE_OPTIONS, test.cb)
            )
            .to.eventually.deep.equal(test.expectedData);
          });

          it('given all parameters and multiple payloads', () => {
            this.invokeMock.twice().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: TEST_CLIENT_CONTEXT
            }).resolves(testData);

            const expectedData = test.cb
              ? test.expectedData
              : test.expectedData.concat( test.expectedData);

            return expect(
              invoker.invokeAsync({ functionName: TEST_FUNCTION_NAME, payloads: [TEST_PAYLOAD, TEST_PAYLOAD], clientContext: TEST_CLIENT_CONTEXT }, test.cb)
            )
            .to.eventually.deep.equal(expectedData);
          });

          it('given all parameters and more payloads than maxConcurrency', () => {
            this.invokeMock.twice().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: TEST_CLIENT_CONTEXT
            }).resolves(testData);

            const expectedData = test.cb
              ? test.expectedData
              : test.expectedData.concat( test.expectedData);

            return expect(
              invoker.invokeAsync({ functionName: TEST_FUNCTION_NAME, payloads: [TEST_PAYLOAD, TEST_PAYLOAD], clientContext: TEST_CLIENT_CONTEXT, options: { maxConcurrency: 1 } }, test.cb)
            )
            .to.eventually.deep.equal(expectedData);
          });

          it('should invoke lambda function correctly when clientContext is not passed', () => {
            this.invokeMock.once().withExactArgs({
              functionName: TEST_FUNCTION_NAME,
              payload: TEST_PAYLOAD,
              clientContext: undefined
            }).resolves(testData);

            return expect(
              invoker.invokeAsync({ functionName: TEST_FUNCTION_NAME, payloads: TEST_PAYLOAD }, test.cb)
            )
            .to.eventually.deep.equal(test.expectedData);
          });
        });
      });
    });
  });
});
