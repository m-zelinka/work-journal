import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher, useFetchers, useLoaderData } from '@remix-run/react'
import { compareDesc, format, formatISO, startOfWeek } from 'date-fns'
import { CloudIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Fragment } from 'react'
import { useSpinDelay } from 'spin-delay'
import { Empty } from '~/components/empty'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { getUserId, requireUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { cx } from '~/utils/misc'
import { EntryEditor } from './resources.entry-editor'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data
        ? data.ownerIsSignedIn
          ? 'Dashboard'
          : `${data.owner.first} ${data.owner.last}`
        : 'Not Found',
    },
  ]
}

type LoaderData = SerializeFrom<typeof loader>
export type Entry = LoaderData['ownerEntries'][number]

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserId(request)

  const owner = await prisma.user.findUnique({
    select: { id: true, first: true, last: true, createdAt: true },
    where: { username: params.username },
  })
  invariantResponse(
    owner,
    `No user with the username "${params.username}" exists.`,
    { status: 404 },
  )

  const ownerIsSignedIn = userId === owner.id

  const ownerEntries = await prisma.entry.findMany({
    select: {
      id: true,
      date: true,
      type: true,
      privacy: true,
      text: true,
      link: true,
    },
    where: {
      user: { username: params.username },
      privacy: ownerIsSignedIn ? undefined : 'public',
    },
  })

  return json({ owner, ownerIsSignedIn, ownerEntries })
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request)

  const formData = await request.formData()

  if (formData.get('intent') === 'deleteEntry') {
    const entryId = formData.get('entryId')
    invariantResponse(
      typeof entryId === 'string',
      `Invalid entryId: ${entryId ?? 'Missing'}`,
      { status: 400 },
    )

    const entry = await prisma.entry.findUnique({
      select: { id: true },
      where: { id: entryId, userId },
    })
    invariantResponse(entry, `No entry with the id "${entryId}" exists`, {
      status: 404,
    })

    await prisma.entry.delete({
      select: { id: true },
      where: { id: entry.id, userId },
    })

    return json({ ok: true })
  }

  invariantResponse(
    false,
    `Invalid intent: ${formData.get('intent') ?? 'Missing'}`,
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}

export default function Component() {
  const { owner, ownerIsSignedIn, ownerEntries } =
    useLoaderData<typeof loader>()

  return (
    <>
      {ownerIsSignedIn ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>New entry</CardTitle>
              <EntrySavingIndicator />
            </div>
          </CardHeader>
          <CardContent>
            <EntryEditor />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {`${owner.first} ${owner.last}`}&apos;s journal
          </h1>
          <p className="text-sm text-muted-foreground">
            Joined{' '}
            <time dateTime={formatISO(owner.createdAt)}>
              {format(owner.createdAt, 'PP')}
            </time>
          </p>
        </div>
      )}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {ownerEntries.length ? (
            <EntryList entries={ownerEntries} showToolbar={ownerIsSignedIn} />
          ) : (
            <Empty
              title="No entries"
              description={
                ownerIsSignedIn
                  ? "You haven't saved any entries yet."
                  : `${owner.first} hasn't saved any journal entries yet.`
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}

function EntrySavingIndicator() {
  const pendingEntries = usePendingEntries()
  const showSavingIndicator = useSpinDelay(pendingEntries.length > 0)

  if (!showSavingIndicator) {
    return null
  }

  return <CloudIcon className="size-5 animate-pulse text-gray-400" />
}

function usePendingEntries() {
  type PendingEntryFetcher = ReturnType<typeof useFetchers>[number] & {
    formData: FormData
  }

  return useFetchers()
    .filter(
      (fetcher): fetcher is PendingEntryFetcher =>
        fetcher.formData?.get('intent') === 'createEntry',
    )
    .map((fetcher) => {
      const id = String(fetcher.formData.get('id'))
      const date = String(fetcher.formData.get('date'))
      const type = String(fetcher.formData.get('type'))
      const privacy = String(fetcher.formData.get('privacy'))
      const text = String(fetcher.formData.get('text'))
      const link = String(fetcher.formData.get('link'))
      const entry: Entry = { id, date, type, privacy, text, link }

      return entry
    })
}

function EntryList({
  entries,
  showToolbar,
}: {
  entries: Array<Entry>
  showToolbar?: boolean
}) {
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))

  // Merge pending and existing entries
  const pendingEntries = usePendingEntries()
  for (const pendingEntry of pendingEntries) {
    const entry = entriesById.get(pendingEntry.id)
    const merged = entry ? { ...entry, ...pendingEntry } : pendingEntry
    entriesById.set(pendingEntry.id, merged)
  }

  const entriesToShow = [...entriesById.values()].sort((a, b) =>
    compareDesc(a.date, b.date),
  )

  // Group entries by week
  const entriesByWeek: Record<string, Array<(typeof entries)[number]>> = {}
  for (const entry of entriesToShow) {
    const sunday = startOfWeek(entry.date)
    const sundayString = format(sunday, 'yyyy-MM-dd')

    entriesByWeek[sundayString] ||= []
    entriesByWeek[sundayString].push(entry)
  }

  const weeks = Object.keys(entriesByWeek).map((dateString) => ({
    dateString,
    sections: {
      '🏗 Work': entriesByWeek[dateString].filter(
        (entry) => entry.type === 'work',
      ),
      '💫 Learnings': entriesByWeek[dateString].filter(
        (entry) => entry.type === 'learning',
      ),
      '😮 Interesting Things': entriesByWeek[dateString].filter(
        (entry) => entry.type === 'interesting-thing',
      ),
    },
  }))

  return (
    <ul className="grid gap-6">
      {weeks.map((week, weekIndex) => (
        <li key={week.dateString} className="relative flex gap-4">
          <div
            className={cx(
              weekIndex === weeks.length - 1 ? 'h-6' : '-bottom-6',
              'absolute left-0 top-0 flex w-6 justify-center',
            )}
            aria-hidden
          >
            <div className="w-px bg-border" />
          </div>
          <div
            className="relative flex size-6 flex-none items-center justify-center bg-background"
            aria-hidden
          >
            <div className="size-1.5 rounded-full border border-muted-foreground" />
          </div>
          <div className="flex-auto py-0.5">
            <p className="text-sm font-semibold text-primary">
              Week of {format(week.dateString, 'MMMM d, yyyy')}
            </p>
            {Object.entries(week.sections).map(([title, entries]) =>
              entries.length ? (
                <Fragment key={title}>
                  <p className="mt-6 text-lg font-semibold tracking-tight">
                    {title}
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {entries.map((entry) => (
                      <EntryListItem
                        key={entry.id}
                        entry={entry}
                        showToolbar={showToolbar}
                      />
                    ))}
                  </ul>
                </Fragment>
              ) : null,
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function EntryListItem({
  entry,
  showToolbar,
}: {
  entry: Entry
  showToolbar?: boolean
}) {
  const deleteFetcher = useFetcher()
  const deleting = deleteFetcher.state !== 'idle'

  return deleting ? null : (
    <li className="group flex items-center gap-4">
      <p className="text-sm text-muted-foreground">
        {entry.text}{' '}
        {entry.link ? (
          <a
            href={entry.link}
            className="inline-block text-sm text-foreground underline"
          >
            Link
          </a>
        ) : null}
      </p>
      {showToolbar ? (
        <div className="-my-1 flex gap-3 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
          <Form action={`entries/${entry.id}/edit`}>
            <Button variant="ghost" size="icon-xs">
              <PencilIcon className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </Form>
          <deleteFetcher.Form
            method="POST"
            onSubmit={(event) => {
              const shouldDelete = confirm(
                'Please confirm you want to delete this record.',
              )

              if (!shouldDelete) {
                event.preventDefault()
              }
            }}
          >
            <input type="hidden" name="intent" value="deleteEntry" />
            <input type="hidden" name="entryId" value={entry.id} />
            <Button variant="ghost" size="icon-xs">
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </deleteFetcher.Form>
        </div>
      ) : null}
    </li>
  )
}
