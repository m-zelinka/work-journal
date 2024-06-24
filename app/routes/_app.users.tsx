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
import { EyeIcon, RefreshCcwIcon, SearchIcon } from 'lucide-react'
import { matchSorter } from 'match-sorter'
import { useEffect, useRef } from 'react'
import sortBy from 'sort-by'
import { useSpinDelay } from 'spin-delay'
import { Empty } from '~/components/empty'
import { Badge } from '~/components/ui/badge'
import { Button, buttonVariants } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
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
    <>
      <h1 className="sr-only">Discover users</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent users</CardTitle>
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
              {users.map((account) => {
                const userIsAccountOwner = user?.username === account.username

                return (
                  <div
                    key={account.username}
                    className="group flex items-center gap-4"
                  >
                    <div className="grid gap-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium leading-none">
                          {`${account.first} ${account.last}`}{' '}
                          <span className="font-normal text-muted-foreground">
                            ({account.username})
                          </span>
                        </p>
                        {userIsAccountOwner ? (
                          <Badge className="-my-1" variant="secondary">
                            Your account
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Joined{' '}
                        <time dateTime={formatISO(account.createdAt)}>
                          {format(account.createdAt, 'PP')}
                        </time>
                      </p>
                    </div>
                    <div className="ml-auto flex gap-3 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon">
                            <Link to={`/users/${account.username}`}>
                              <EyeIcon className="size-5" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View profile</TooltipContent>
                      </Tooltip>
                    </div>
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
      {!user ? (
        <div className="mt-8">
          <Empty
            title="Ready to join us?"
            description="Create an account to organize your learnings and doings"
          >
            <Link to="/join" className={buttonVariants()}>
              Get started
            </Link>
          </Empty>
        </div>
      ) : null}
    </>
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
