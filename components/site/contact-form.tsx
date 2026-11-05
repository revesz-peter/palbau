"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Link } from "@/i18n/navigation"
import {
  contactSchema,
  type ContactErrorKey,
  type ContactInput,
} from "@/lib/contact-schema"
import { cn } from "@/lib/utils"

const FIELD_CLASS =
  "mt-2 rounded-sm border-2 border-input bg-card px-4 text-lg text-card-foreground shadow-none focus-visible:border-foreground focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0 md:text-lg"

type Status = "idle" | "sent" | "invalid" | "unavailable"

export function ContactForm() {
  const t = useTranslations("contact")
  const id = useId()
  const [status, setStatus] = useState<Status>("idle")
  const [honeypot, setHoneypot] = useState("")

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      consent: false,
    },
  })

  const errorFor = (field: keyof ContactInput) => {
    const key = errors[field]?.message as ContactErrorKey | undefined
    if (!key) return null
    return (
      <p
        id={`${id}-${field}-error`}
        className="mt-2 text-base font-semibold text-destructive"
      >
        {t(`errors.${key}`)}
      </p>
    )
  }

  const fieldProps = (field: keyof ContactInput) => ({
    id: `${id}-${field}`,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
  })

  const onSubmit = handleSubmit(async (values) => {
    setStatus("idle")
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      })
      if (response.ok) {
        reset()
        setStatus("sent")
        return
      }
      setStatus(response.status === 400 ? "invalid" : "unavailable")
    } catch {
      setStatus("unavailable")
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-6">
        <div>
          <Label htmlFor={`${id}-name`}>{t("form.name")}</Label>
          <Input
            {...register("name")}
            {...fieldProps("name")}
            autoComplete="name"
            className={cn(FIELD_CLASS, "h-14")}
          />
          {errorFor("name")}
        </div>
        <div>
          <Label htmlFor={`${id}-email`}>{t("form.email")}</Label>
          <Input
            {...register("email")}
            {...fieldProps("email")}
            type="email"
            autoComplete="email"
            className={cn(FIELD_CLASS, "h-14")}
          />
          {errorFor("email")}
        </div>
      </div>
      <div>
        <Label htmlFor={`${id}-phone`}>{t("form.phone")}</Label>
        <Input
          {...register("phone")}
          {...fieldProps("phone")}
          type="tel"
          autoComplete="tel"
          className={cn(FIELD_CLASS, "h-14")}
        />
        {errorFor("phone")}
      </div>
      <div>
        <Label htmlFor={`${id}-message`}>{t("form.message")}</Label>
        <p className="mt-1 text-base">{t("form.messageHint")}</p>
        <Textarea
          {...register("message")}
          {...fieldProps("message")}
          rows={4}
          className={cn(FIELD_CLASS, "min-h-32 resize-y py-3")}
        />
        {errorFor("message")}
      </div>

      {/* Hidden from people. Bots that fill it are dropped by the API route. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={`${id}-website`}>{t("form.honeypot")}</label>
        <input
          id={`${id}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                {...fieldProps("consent")}
                ref={field.ref}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                className="mt-0.5 size-7 rounded-sm border-2 border-foreground bg-card data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground [&_svg]:size-5"
              />
            )}
          />
          <label htmlFor={`${id}-consent`} className="text-base text-pretty">
            {t("form.consentBefore")}
            <Link href="/adatvedelem" className="underline underline-offset-4">
              {t("form.consentLink")}
            </Link>
            {t("form.consentAfter")}
          </label>
        </div>
        {errorFor("consent")}
      </div>

      <div className="flex flex-col items-start gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 px-7 text-lg"
        >
          {isSubmitting ? t("form.sending") : t("form.submit")}
        </Button>
        <div aria-live="polite">
          {status === "sent" ? (
            <p className="text-lg font-semibold">{t("form.sent")}</p>
          ) : null}
          {status === "invalid" ? (
            <p className="font-semibold text-destructive">
              {t("errors.invalid")}
            </p>
          ) : null}
          {status === "unavailable" ? (
            <p className="font-semibold text-destructive">
              {t("errors.unavailable")}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  )
}
