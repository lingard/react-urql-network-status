import { createClient as createUrqlClient, fetchExchange } from 'urql'
import { networkStatusExchange } from '../src'

const token = process.env.GITHUB_AUTH_TOKEN

export const createClient = () =>
  createUrqlClient({
    url: 'https://api.github.com/graphql',
    exchanges: [networkStatusExchange(), fetchExchange],
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
