import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
  type SubmissionResult,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, useSubmit } from "@remix-run/react";
import { format } from "date-fns";
import { LinkIcon } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { ErrorList } from "./forms";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const typeOptions = {
  work: "Work",
  learning: "Learning",
  "interesting-thing": "Interesting thing",
} as const;

const privacyOptions = {
  everyone: "Everyone",
  owner: "Owner",
} as const;

export const schema = z.object({
  date: z.coerce
    .date({ required_error: "Date is required" })
    .transform((arg) => arg.toISOString()),
  type: z.enum(["work", "learning", "interesting-thing"], {
    required_error: "Type is required",
  }),
  privacy: z.enum(["everyone", "owner"], {
    required_error: "Privacy setting is required",
  }),
  text: z
    .string({ required_error: "Entry is required" })
    .trim()
    .min(1, "Entry is too short")
    .max(255, "Entry is too long"),
  link: z
    .string()
    .trim()
    .url("Link in invalid")
    .optional()
    .transform((arg) => arg || null),
});

export function EntryForm({
  lastResult,
}: {
  lastResult?: SubmissionResult | null;
}) {
  const submit = useSubmit();

  const [form, fields] = useForm({
    defaultValue: {
      type: Object.keys(typeOptions)[0],
      date: format(new Date(), "yyyy-MM-dd"),
      privacy: Object.keys(privacyOptions)[0],
    },
    constraint: getZodConstraint(schema),
    lastResult,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    onSubmit: (event, context) => {
      event.preventDefault();

      const submission = parseWithZod(context.formData, { schema });

      if (submission.status !== "success") {
        return;
      }

      const entry = submission.value;

      submit(
        {
          intent: "createEntry",
          ...entry,
          id: window.crypto.randomUUID(),
          link: entry.link || "",
        },
        {
          method: context.method,
          action: context.action,
          navigate: false,
          unstable_flushSync: true,
        },
      );

      clearFormInputs();
    },
  });

  const textRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const clearFormInputs = () => {
    if (textRef.current) {
      textRef.current.value = "";
      textRef.current.focus();
    }

    if (linkRef.current) {
      linkRef.current.value = "";
    }
  };

  return (
    <Form method="POST" {...getFormProps(form)}>
      <input type="hidden" name="intent" value="createEntry" />
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label id={fields.date.id} className="sr-only">
              Date
            </Label>
            <Input {...getInputProps(fields.date, { type: "date" })} />
            <ErrorList id={fields.date.errorId} errors={fields.date.errors} />
          </div>
          <div className="grid gap-2 md:order-first">
            <Select
              name={fields.type.name}
              required={fields.type.required}
              defaultValue={fields.type.value}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Type</SelectLabel>
                  {Object.entries(typeOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ErrorList id={fields.type.errorId} errors={fields.type.errors} />
          </div>
          <div className="grid gap-2">
            <Select
              name={fields.privacy.name}
              required={fields.privacy.required}
              defaultValue={fields.privacy.value}
            >
              <SelectTrigger>
                <SelectValue placeholder="Who can view" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Privacy setting</SelectLabel>
                  {Object.entries(privacyOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ErrorList
              id={fields.privacy.errorId}
              errors={fields.privacy.errors}
            />
          </div>
        </div>
        <div className="grid gap-2 md:col-span-full">
          <Label id={fields.text.id} className="sr-only">
            Entry
          </Label>
          <Textarea
            ref={textRef}
            onKeyDown={(event) => {
              // Submit form on enter keydown event
              if (event.key === "Enter") {
                event.preventDefault();

                event.currentTarget.form?.dispatchEvent(
                  new Event("submit", {
                    bubbles: true,
                    cancelable: true,
                  }),
                );
              }
            }}
            className="min-h-24 resize-none"
            {...getTextareaProps(fields.text)}
          />
          <ErrorList id={fields.text.errorId} errors={fields.text.errors} />
        </div>
        <div className="grid gap-2 md:col-span-full">
          <Label id={fields.link.id} className="sr-only">
            Link
          </Label>
          <div className="relative">
            <LinkIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              ref={linkRef}
              placeholder="Optional link"
              className="pl-8"
              {...getInputProps(fields.link, { type: "url" })}
            />
          </div>
          <ErrorList id={fields.link.errorId} errors={fields.link.errors} />
        </div>
        <div className="md:col-span-full">
          <Button type="submit" className="w-full">
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
