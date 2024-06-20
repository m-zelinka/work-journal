import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { format, formatISO } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/utils/db.server";
import { useOptionalUser } from "~/utils/user";

export const meta: MetaFunction = () => {
  return [{ title: "Discover" }];
};

export async function loader() {
  const users = await prisma.user.findMany({
    select: { username: true, first: true, last: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return json({ users });
}

export default function Component() {
  const { users } = useLoaderData<typeof loader>();

  const user = useOptionalUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discover users</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="-my-4 divide-y divide-border">
          {users.map((userAccount) => {
            const isSignedInUser = user?.username === userAccount.username;

            return (
              <div
                key={userAccount.username}
                className="flex items-center gap-4 py-4"
              >
                <div className="grid gap-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium leading-none">
                      {`${userAccount.first} ${userAccount.last}`}{" "}
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
                    Joined{" "}
                    <time dateTime={formatISO(userAccount.createdAt)}>
                      {format(userAccount.createdAt, "PP")}
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
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
