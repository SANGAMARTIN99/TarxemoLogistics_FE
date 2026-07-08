import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || '/graphql/';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

const authLink = new ApolloLink((operation, forward) => {
  try {
    const stored = localStorage.getItem('tarxemo-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      const token = state?.accessToken;
      if (token) {
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        }));
      }
    }
  } catch {}
  return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      console.error('[GraphQL error]:', err.message);
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        localStorage.removeItem('tarxemo-storage');
        window.location.href = '/auth';
      }
    }
  }
  if (networkError) {
    console.error('[Network error]:', networkError);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
  },
});
