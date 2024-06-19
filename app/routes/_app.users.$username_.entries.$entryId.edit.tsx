import { invariantResponse } from "@epic-web/invariant";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { ChevronLeftIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { EntryEditor } from "./resources.entry-editor";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Edit entry",
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  invariantResponse(
    params.entryId,
    `Invalid entryId: ${params.entryId ?? "Missing"}`,
  );
  const entry = await prisma.entry.findUnique({
    select: {
      id: true,
      date: true,
      type: true,
      privacy: true,
      text: true,
      link: true,
    },
    where: { id: params.entryId, userId },
  });
  invariantResponse(entry, `No entry with the id "${params.entryId}" exists`, {
    status: 404,
  });

  return json({ entry });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();

  if (formData.get("intent") === "deleteEntry") {
    const userId = await requireUserId(request);

    invariantResponse(
      params.entryId,
      `Invalid entryId: ${params.entryId ?? "Missing"}`,
    );

    const entry = await prisma.entry.findUnique({
      select: { id: true },
      where: { id: params.entryId, userId },
    });
    invariantResponse(
      entry,
      `No entry with the id "${params.entryId}" exists`,
      {
        status: 404,
      },
    );

    await prisma.entry.delete({
      select: { id: true },
      where: { id: entry.id, userId },
    });

    return redirect("/me");
  }

  invariantResponse(
    false,
    `Invalid intent: ${formData.get("intent") ?? "Missing"}`,
  );
}

export default function Component() {
  const { entry } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/me" className="flex items-center gap-3">
                  <ChevronLeftIcon className="size-4" /> Go back
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Form
          method="POST"
          onSubmit={(event) => {
            const shouldDelete = confirm(
              "Please confirm you want to delete this record.",
            );

            if (!shouldDelete) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="intent" value="deleteEntry" />
          <Button type="submit" variant="destructive" size="sm">
            Delete this entry…
          </Button>
        </Form>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit entry</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryEditor entry={entry} />
        </CardContent>
      </Card>
    </div>
  );
}
