import type { MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Logo } from '~/components/logo'
import { buttonVariants } from '~/components/ui/button'
import { useOptionalUser } from '~/utils/user'

export const meta: MetaFunction = () => {
  return [{ title: 'Welcome' }]
}

export default function Component() {
  const user = useOptionalUser()

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Logo className="mx-auto h-11 w-auto" />
        <div className="text-center">
          <h1 className="mt-10 text-balance text-4xl font-extrabold tracking-tight lg:text-5xl">
            A better way to organize your learnings and doings
          </h1>
          <p className="mt-6 text-pretty text-xl text-muted-foreground">
            Your new daily work journal, helping clear your head.
          </p>
        </div>
        <div className="mt-10 flex items-start justify-center gap-4">
          {user ? (
            <div className="grid place-items-center gap-1">
              <Link to="/me" className={buttonVariants()}>
                <span>
                  Continue to dashboard <span aria-hidden>→</span>
                </span>
              </Link>
              <p className="text-[0.8rem] text-muted-foreground">
                Signed in as{' '}
                <span className="font-medium text-foreground">
                  {user.email}
                </span>
              </p>
            </div>
          ) : (
            <>
              <Link to="/join" className={buttonVariants()}>
                Get started
              </Link>
              <Link
                to="/login"
                className={buttonVariants({ variant: 'secondary' })}
              >
                <span>
                  Log in <span aria-hidden>→</span>
                </span>
              </Link>
            </>
          )}
          <Link to="/users" className={buttonVariants({ variant: 'outline' })}>
            Discover
          </Link>
        </div>
      </div>
    </div>
  )
}
