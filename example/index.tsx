import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { gql, Provider, useQuery } from 'urql'
import { NetworkStatusReporter } from './components'
import { createClient } from './createClient'

const client = createClient()

const reposQuery = gql`
  query {
    viewer {
      login
      repositories(last: 5) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`

const Repos = () => {
  const [query, refetch] = useQuery({ query: reposQuery })

  if (query.fetching || !query.data) {
    return null
  }

  return (
    <div>
      <span>{query.data.viewer.login}</span>
      <button onClick={() => refetch()}>refetch</button>
    </div>
  )
}

const Root = () => (
  <div style={{ padding: 10 }}>
    <Provider value={client}>
      <NetworkStatusReporter />
      <Repos />
    </Provider>
  </div>
)

ReactDOM.render(<Root />, document.getElementById('root'))
