# aws-lambda-batch-invoker

Module that allows batch invoking a lambda function synchronously via the `RequestResponse` invocationType or asynchronously via the `Event` invocationType.

# Usage

## new BatchInvoker(options)
Constructor for the class.
- **options** - { Object, optional } - an object to provide configuration options.
  - **client** - { Object, optional } - a valid lambda client. If no client is provided, the default lambda client will be used.
  - **logger** - { Object/Function, optional } - a valid logger. If no logger is provided, no debug information or errors will be logged.
  - **compressPayloads** - { boolean, optional } - whether the payloads should be compressed to remove whitespace when being stringified. Defaults to false.
  - **maxConcurrency** - { Number } - controls the max number of invocations started at the same time. Defaults to 5.

```javascript
const Invoker = require('aws-lambda-batch-invoker');
const logger = require('./path/to/your/logger');

// no logger
const invoker = new Invoker();

// logger as option
const invoker2 = new Invoker({ logger });

// override class defaults with options
const invoker2 = new Invoker({ maxConcurrency: 10 });

```

## invoke(options, cb)
Method to synchronously invoke a lambda function via `RequestResponse` invocationType.
- **options** - { Object, required } - lambda invoke options
  - **functionName** - { String, required } - the lambda function you wish to invoke.
  - **payloads** - { Object[], required } - the payloads you wish to send to the lambda function. If only one is provided, will convert to an array.
  - **clientContext** - { Object, base64-encoded } - used to pass client-specific information to the lambda function being invoked via the context variable.
  - **options** - { Object } - configuration options for batch invoke, overrides class set defaults.
    - **compressPayloads** - { boolean, optional } - whether the payloads should be compressed to remove whitespace when being stringified. Defaults to false.
    - **maxConcurrency** - { Number } - controls the max number of invocations started at the same time. Defaults to 5.
- **cb** - { function } - takes params err and result and is called on success or failure of batch invoking the lambda function. By default returns a promise that rejects on error or resolves with the result from batch invoking the lambda.

```javascript
const Invoker = require('aws-lambda-batch-invoker');

const invoker = new Invoker();

// lambda handler
module.exports.handler = function(event, context, cb) {
  const invokeOptions = {
    functionName: 'testFunctionName',
    payloads: [
      { data: 'foo' },
      { data: 'bar' },
      { data: 'baz' }
    ],
    clientContext: { requestId: context.awsRequestId }
  };
  invoker.invoke(invokeOptions, cb);
};
```

## invokeAsync(options, cb)
Method to synchronously invoke a lambda function via `Event` invocationType.
- **options** - { Object, required } - lambda invoke options
  - **functionName** - { String, required } - the lambda function you wish to invoke.
  - **payloads** - { Object[], required } - the payloads you wish to send to the lambda function. If only one is provided, will convert to an array.
  - **clientContext** - { Object, base64-encoded } - used to pass client-specific information to the lambda function being invoked via the context variable.
  - **options** - { Object } - configuration options for batch invoke, overrides class set defaults.
    - **maxConcurrency** - { Number } - controls the max number of invocations started at the same time. Defaults to 5.
- **cb** - { function } - takes params err and result and is called on success or failure of batch invoking the lambda function. By default returns a promise that rejects on error or resolves with the result from batch invoking the lambda.

```javascript
const Invoker = require('aws-lambda-batch-invoker');

const invoker = new Invoker();

// lambda handler
module.exports.handler = function(event, context, cb) {
  const invokeOptions = {
    functionName: 'testFunctionName',
    payloads: [
      { data: 'foo' },
      { data: 'bar' },
      { data: 'baz' }
    ],
    clientContext: { requestId: context.awsRequestId }
  };
  invoker.invokeAsync(invokeOptions, cb);
};
```
