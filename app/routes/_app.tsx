import type { User } from "@prisma/client";
import {
  Link,
  NavLink,
  Outlet,
  useRevalidator,
  useSubmit,
  type NavLinkProps,
} from "@remix-run/react";
import { CircleUserIcon, MenuIcon } from "lucide-react";
import { Logo } from "~/components/logo";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { cx } from "~/utils/misc";
import { useOptionalUser } from "~/utils/user";

export default function Component() {
  const user = useOptionalUser();

  const navigation = getNavigationItems(user);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden md:flex md:items-center md:gap-5 lg:gap-6">
          <Logo className="h-6 w-auto" />
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end
              className={({ isActive }) =>
                cx(
                  "text-sm font-medium",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground transition-colors hover:text-foreground",
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <MenuIcon className="size-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6">
              <Logo className="h-6 w-auto" />
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      "text-lg font-medium",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground transition-colors hover:text-foreground",
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end">
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <Link
              to="/login"
              className={buttonVariants({ variant: "secondary" })}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="mx-auto w-full max-w-3xl flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function getNavigationItems(user: Pick<User, "username"> | null) {
  const navigation: Array<{ name: string; to: NavLinkProps["to"] }> = [
    { name: "Discover", to: "/users" },
  ];

  if (user) {
    navigation.unshift({ name: "Dashboard", to: `/users/${user.username}` });
  }

  return navigation;
}

function UserDropdown({
  user,
}: {
  user: Pick<User, "username" | "first" | "last" | "email">;
}) {
  const submit = useSubmit();
  const revalidator = useRevalidator();
  function signOut() {
    submit(null, {
      method: "post",
      action: "/logout",
      // Force flush any updates to ensure that the DOM is updated immediately.
      unstable_flushSync: true,
    });
    revalidator.revalidate();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <CircleUserIcon className="size-5" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {`${user.first} ${user.last}`} ({user.username})
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
