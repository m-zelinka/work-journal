import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/node'
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useResolvedPath,
  useSearchParams,
} from '@remix-run/react'
import { format, formatISO } from 'date-fns'
import { RefreshCcwIcon, SearchIcon } from 'lucide-react'
import { matchSorter } from 'match-sorter'
import { useEffect, useRef } from 'react'
import sortBy from 'sort-by'
import { useSpinDelay } from 'spin-delay'
import { Empty } from '~/components/empty'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { prisma } from '~/utils/db.server'
import { useOptionalUser } from '~/utils/user'

export const meta: MetaFunction = () => {
  return [{ title: 'Discover' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')

  let users = await prisma.user.findMany({
    select: { username: true, first: true, last: true, createdAt: true },
  })

  if (q) {
    users = matchSorter(users, q, { keys: ['username', 'first', 'last'] })
  }

  users = users.sort(sortBy('createdAt'))

  return json({ users })
}

export default function Component() {
  const { users } = useLoaderData<typeof loader>()

  const user = useOptionalUser()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Discover users</CardTitle>
          <search role="search">
            <Form>
              <SearchBar />
            </Form>
          </search>
        </div>
      </CardHeader>
      <CardContent>
        {users.length ? (
          <ul className="grid gap-8">
            {users.map((userAccount) => {
              const isSignedInUser = user?.username === userAccount.username

              return (
                <div
                  key={userAccount.username}
                  className="flex items-center gap-4"
                >
                  <div className="grid gap-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium leading-none">
                        {`${userAccount.first} ${userAccount.last}`}{' '}
                        <span className="font-normal text-muted-foreground">
                          ({userAccount.username})
                        </span>
                      </p>
                      {isSignedInUser ? (
                        <Badge className="-my-1" variant="secondary">
                          Your account
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined{' '}
                      <time dateTime={formatISO(userAccount.createdAt)}>
                        {format(userAccount.createdAt, 'PP')}
                      </time>
                    </p>
                  </div>
                  <Link
                    to={`/users/${userAccount.username}`}
                    className="ml-auto font-medium"
                  >
                    View
                  </Link>
                </div>
              )
            })}
          </ul>
        ) : (
          <Empty
            title="No users found"
            description="We couldn’t find anything with that term. Please try again."
          />
        )}
      </CardContent>
    </Card>
  )
}

function SearchBar() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q')

  const navigation = useNavigation()
  const usersRoute = useResolvedPath('/users')
  const searching =
    navigation.location?.pathname === usersRoute.pathname &&
    new URLSearchParams(navigation.location?.search).has('q')
  const showSpinner = useSpinDelay(searching)

  const inputRef = useRef<HTMLInputElement>(null)

  // Sync search input value with the URL Search Params
  useEffect(() => {
    const searchField = inputRef.current
    if (searchField) {
      searchField.value = q ?? ''
    }
  }, [q])

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5"
        aria-hidden
      >
        {showSpinner ? (
          <RefreshCcwIcon className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <SearchIcon className="size-4 text-muted-foreground" />
        )}
      </div>
      <Input
        ref={inputRef}
        type="search"
        name="q"
        id="q"
        defaultValue={q ?? undefined}
        className="pl-8"
        placeholder="Search"
        aria-label="Search users by name or username"
      />
    </div>
  )
}
