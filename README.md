# Work Journal

This project is a simple work journaling app, for daily logging of learnings and doings. It's written in [TypeScript](https://www.typescriptlang.org/), using [Remix](https://remix.run/), [React.js](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/). For database, I'm using [Prisma ORM](https://www.prisma.io/). I've deployed this project on [Fly.io](https://fly.io/).

## Get started

1. Clone the repository:

   ```sh
   git clone https://github.com/m-zelinka/work-journal.git
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Define required env variables:

   > [!IMPORTANT]
   > You must define your env vars before the next step.

   - Copy the template contents in [.env.example](.env.example) to a new file named `.env` and fill all the required fields.

4. Run the application in dev mode:

   ```sh
   npm run dev
   ```

## Goals

I tried to practice working with [optimistic data](https://remix.run/docs/en/main/discussion/pending-ui#pending-and-optimistic-ui) using Remix.

## Credits

- App idea from [Bulid UI - Ship an app with Remix](https://buildui.com/courses/ship-an-app-with-remix)
- Logo from [Shapes](https://shapes.framer.website/)
