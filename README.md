# react-urql-network-status

Tracks the pending queries & mutations of a urql instance, useful for implementing
global loading and error handling.

## Usage

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { createClient } from 'urql';
import { createNetworkStatusNotifier } from 'react-urql-network-status';

const { exchange, useUrqlNetworkStatus } = createNetworkStatusNotifier();

const GlobalLoadingIndicator = () =>  {
  const status = useUrqlNetworkStatus();

  if (status.query.pending.length === 0) {
    return null
  }

  return <p>Loading …</p>;
}

const client = createClient({
  url: 'localhost:8080/graphql'
  exchanges: [exchange]
});

const element = (
  <Provider value={client}>
    <GlobalLoadingIndicator />
    <App />
  </Provider>
);

ReactDOM.render(element, document.getElementById('root'));
```

## Returned data

The `useUrqlNetworkStatus` hook returns an object with the following properties:

```tsx
interface NetworkStatus {
  query: {
    pending: Operation[];
    latestError: Option<CombinedError>
  }
  mutation: {
    pending: Operation[];
    latestError: Option<CombinedError>
  }
};

type OperationError = {
  networkError?: Error | ServerError | ServerParseError;
  operation?: Operation;
  response?: ExecutionResult;
  graphQLErrors?: ReadonlyArray<GraphQLError>;
};
```
