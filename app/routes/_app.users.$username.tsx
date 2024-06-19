import { parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type SerializeFrom,
} from "@remix-run/node";
import { useActionData, useFetchers, useLoaderData } from "@remix-run/react";
import { compareDesc, format, startOfWeek } from "date-fns";
import { Fragment } from "react";
import { Empty } from "~/components/empty";
import { EntryForm, schema as entryFormSchema } from "~/components/entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getUserId, requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { cx } from "~/utils/misc";
import { useOptionalUser } from "~/utils/user";

type LoaderData = SerializeFrom<typeof loader>;
export type Entry = LoaderData["ownerEntries"][number];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserId(request);

  const owner = await prisma.user.findUnique({
    select: {
      id: true,
      first: true,
      last: true,
    },
    where: { username: params.username },
  });
  invariantResponse(
    owner,
    `No user with the username "${params.username}" exists.`,
    { status: 404 },
  );

  const ownerIsSignedIn = userId === owner.id;

  const ownerEntries = await prisma.entry.findMany({
    select: { id: true, date: true, type: true, text: true, link: true },
    where: {
      user: { username: params.username },
      privacy: ownerIsSignedIn ? undefined : "everyone",
    },
  });

  return json({ owner, ownerEntries });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: entryFormSchema });

  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      { status: submission.status === "error" ? 400 : 200 },
    );
  }

  const entry = submission.value;

  if (formData.get("intent") === "createEntry") {
    await prisma.entry.create({
      data: { ...entry, user: { connect: { id: userId } } },
    });

    return json({ result: submission.reply() });
  }

  invariantResponse(
    false,
    `Invalid intent: ${formData.get("intent") ?? "Missing"}`,
  );
}

export default function Component() {
  const { owner, ownerEntries } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();

  const ownerDisplayName = `${owner.first} ${owner.last}`;

  const user = useOptionalUser();
  const isUserOwner = user?.id === owner.id;

  return (
    <>
      {isUserOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>New entry</CardTitle>
          </CardHeader>
          <CardContent>
            <EntryForm lastResult={actionData?.result} />
          </CardContent>
        </Card>
      ) : (
        <h1 className="text-xl font-semibold tracking-tight">
          {ownerDisplayName}&apos;s Entries
        </h1>
      )}
      <div className="mt-8">
        {ownerEntries.length ? (
          <EntryList entries={ownerEntries} />
        ) : (
          <Empty
            title="No entries"
            description={`${ownerDisplayName} hasn't saved any entries yet.`}
          />
        )}
      </div>
    </>
  );
}

function EntryList({ entries }: { entries: Array<Entry> }) {
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));

  // Merge pending and existing entries
  const pendingEntries = usePendingEntries();
  for (const pendingEntry of pendingEntries) {
    const entry = entriesById.get(pendingEntry.id);
    const merged = entry ? { ...entry, ...pendingEntry } : pendingEntry;
    entriesById.set(pendingEntry.id, merged);
  }

  const entriesToShow = [...entriesById.values()].sort((a, b) =>
    compareDesc(a.date, b.date),
  );

  // Group entries by week
  const entriesByWeek: Record<string, Array<(typeof entries)[number]>> = {};
  for (const entry of entriesToShow) {
    const sunday = startOfWeek(entry.date);
    const sundayString = format(sunday, "yyyy-MM-dd");

    entriesByWeek[sundayString] ||= [];
    entriesByWeek[sundayString].push(entry);
  }

  const weeks = Object.keys(entriesByWeek).map((dateString) => ({
    dateString,
    sections: {
      "🏗 Work": entriesByWeek[dateString].filter(
        (entry) => entry.type === "work",
      ),
      "💫 Learnings": entriesByWeek[dateString].filter(
        (entry) => entry.type === "learning",
      ),
      "😮 Interesting Things": entriesByWeek[dateString].filter(
        (entry) => entry.type === "interesting-thing",
      ),
    },
  }));

  return (
    <ul className="grid gap-6">
      {weeks.map((week, weekIndex) => (
        <li key={week.dateString} className="relative flex gap-4">
          <div
            className={cx(
              weekIndex === weeks.length - 1 ? "h-0" : "-bottom-6",
              "absolute left-0 top-0 flex w-6 justify-center",
            )}
            aria-hidden
          >
            <div className="w-px border-l" />
          </div>
          <div
            className="relative flex size-6 flex-none items-center justify-center bg-background"
            aria-hidden
          >
            <div className="size-1.5 rounded-full border border-muted-foreground" />
          </div>
          <div className="flex-auto py-0.5">
            <p className="text-sm font-semibold">
              Week of {format(week.dateString, "MMMM d, yyyy")}
            </p>
            {Object.entries(week.sections).map(([title, entries]) =>
              entries.length ? (
                <Fragment key={title}>
                  <p className="mt-6 text-lg font-semibold tracking-tight">
                    {title}
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {entries.map((entry) => (
                      <EntryListItem key={entry.id} entry={entry} />
                    ))}
                  </ul>
                </Fragment>
              ) : null,
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function usePendingEntries() {
  type PendingEntryFetcher = ReturnType<typeof useFetchers>[number] & {
    formData: FormData;
  };

  return useFetchers()
    .filter(
      (fetcher): fetcher is PendingEntryFetcher =>
        fetcher.formData?.get("intent") === "createEntry",
    )
    .map((fetcher) => {
      const id = String(fetcher.formData.get("id"));
      const date = String(fetcher.formData.get("date"));
      const type = String(fetcher.formData.get("type"));
      const text = String(fetcher.formData.get("text"));
      const link = String(fetcher.formData.get("link"));
      const entry: Entry = { id, date, type, text, link };

      return entry;
    });
}

function EntryListItem({ entry }: { entry: Entry }) {
  return <li className="text-sm text-muted-foreground">{entry.text}</li>;
}
