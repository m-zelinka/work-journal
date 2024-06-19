import { parseWithZod } from "@conform-to/zod";
import { invariantResponse } from "@epic-web/invariant";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { EntryForm, schema as entryFormSchema } from "~/components/entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { useOptionalUser } from "~/utils/user";

export async function loader({ params }: LoaderFunctionArgs) {
  const owner = await prisma.user.findUnique({
    select: {
      id: true,
      username: true,
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

  return json({ owner });
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
  const { owner } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();

  const ownerDisplayName = `${owner.first} ${owner.last}` ?? owner.username;

  const user = useOptionalUser();
  const isOwner = user?.id === owner.id;

  return (
    <>
      {isOwner ? (
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
    </>
  );
}
