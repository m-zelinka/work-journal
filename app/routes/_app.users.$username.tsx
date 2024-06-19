import { invariantResponse } from "@epic-web/invariant";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
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

export default function Component() {
  const { owner } = useLoaderData<typeof loader>();

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
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="sr-only">Date</Label>
                  <Input type="date" />
                </div>
                <div className="md:order-first">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Type</SelectLabel>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="interesting-thing">
                          Interesting thing
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Who can view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Privacy</SelectLabel>
                        <SelectItem value="everyone">For everyone</SelectItem>
                        <SelectItem value="owner">Only for me</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="md:col-span-full">
                <Label className="sr-only">Entry</Label>
                <Textarea className="min-h-24 resize-none" />
              </div>
              <div className="md:col-span-full">
                <Label className="sr-only">Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="Optional link"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="md:col-span-full">
                <Button type="submit" className="w-full">
                  Save
                </Button>
              </div>
            </div>
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
