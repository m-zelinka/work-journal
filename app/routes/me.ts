import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { logout, requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    select: { username: true },
    where: { id: userId },
  });

  if (!user) {
    return await logout(request);
  }

  return redirect(`/users/${user.username}`);
}
