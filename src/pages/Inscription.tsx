import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import RegistrantQrCode from "@/components/shared/RegistrantQrCode"
import { useAppData } from "@/context/DataProvider"
import { useI18n } from "@/context/I18nProvider"
import type { Registrant } from "@/lib/types"

type FormValues = {
  lastName: string
  firstName: string
  birthDate: string
  birthPlace: string
  nationalId: string
}

export default function Inscription() {
  const [searchParams] = useSearchParams()
  const { data, addRegistrant } = useAppData()
  const { t, dir } = useI18n()
  const [created, setCreated] = useState<Registrant | null>(null)

  const eventId = searchParams.get("event")
  const activityId = searchParams.get("activity")
  const volunteerId = searchParams.get("volunteer")

  const context = useMemo(() => {
    if (eventId) {
      const event = data.events.find((e) => e.id === eventId && e.published)
      if (!event) return { kind: "missing" as const }
      return {
        kind: "event" as const,
        id: event.id,
        title: event.title,
        backTo: `/events/${event.id}`,
        backLabel: t("inscription.backToAnnouncement"),
      }
    }
    if (activityId) {
      const activity = data.activities.find((a) => a.id === activityId && a.published)
      if (!activity) return { kind: "missing" as const }
      return {
        kind: "activity" as const,
        id: activity.id,
        title: activity.title,
        backTo: `/activities/${activity.id}`,
        backLabel: t("inscription.backToAnnouncement"),
      }
    }
    if (volunteerId) {
      const opp = data.volunteerOpportunities.find(
        (v) => v.id === volunteerId && v.published
      )
      if (!opp) return { kind: "missing" as const }
      return {
        kind: "volunteer" as const,
        id: opp.id,
        title: opp.title,
        backTo: "/benevolat",
        backLabel: t("inscription.backToVolunteer"),
      }
    }
    return { kind: "none" as const }
  }, [activityId, data.activities, data.events, data.volunteerOpportunities, eventId, t, volunteerId])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      lastName: "",
      firstName: "",
      birthDate: "",
      birthPlace: "",
      nationalId: "",
    },
  })

  const onSubmit = (values: FormValues) => {
    if (context.kind !== "event" && context.kind !== "activity" && context.kind !== "volunteer") {
      return
    }

    const result = addRegistrant({
      lastName: values.lastName.trim(),
      firstName: values.firstName.trim(),
      birthDate: values.birthDate,
      birthPlace: values.birthPlace.trim(),
      nationalId: values.nationalId.trim(),
      announcementId: null,
      eventId: context.kind === "event" ? context.id : null,
      activityId: context.kind === "activity" ? context.id : null,
      volunteerOpportunityId: context.kind === "volunteer" ? context.id : null,
    })
    if ("error" in result) {
      alert(result.error.startsWith("errors.") ? t(result.error) : result.error)
      return
    }
    reset()
    setCreated(result)
  }

  const textAlign = dir === "rtl" ? "text-right" : "text-left"

  if (context.kind === "none" || context.kind === "missing") {
    return (
      <div className="page-shell">
        <Card className="mx-auto max-w-2xl w-full border-border/60 shadow-soft">
          <CardHeader className={textAlign}>
            <CardTitle className="type-h2">
              {context.kind === "missing"
                ? t("inscription.contextMissing")
                : t("inscription.chooseFirstTitle")}
            </CardTitle>
            <CardDescription>
              {context.kind === "missing"
                ? t("inscription.contextMissingHint")
                : t("inscription.chooseFirstHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className={`flex flex-col sm:flex-row gap-3 ${textAlign}`}>
            <Button asChild>
              <Link to="/activities">{t("inscription.browseActivities")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/benevolat">{t("inscription.browseVolunteer")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contextLabel =
    context.kind === "event"
      ? t("inscription.contextEvent")
      : context.kind === "activity"
        ? t("inscription.contextActivity")
        : t("inscription.contextVolunteer")

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-4xl w-full section-gap">
      <div className={`${textAlign} space-y-3 text-center`}>
        <Button asChild variant="ghost" className="px-0 h-auto text-muted-foreground hover:text-primary mx-auto">
          <Link to={context.backTo} className="inline-flex items-center gap-2">
            <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
            {context.backLabel}
          </Link>
        </Button>
        <h1 className="type-h1">{t("inscription.title")}</h1>
        <p className="type-body mx-auto max-w-lg">{t("inscription.subtitle")}</p>
      </div>

      <div className="rounded-3xl border border-primary/15 bg-primary/5 px-5 py-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {contextLabel}
        </p>
        <p className="text-lg font-bold text-foreground mt-1">{context.title}</p>
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardHeader className={textAlign}>
          <CardTitle className="type-h2">{t("inscription.formTitle")}</CardTitle>
          <CardDescription>{t("inscription.allRequired")}</CardDescription>
        </CardHeader>
        <CardContent>
          {created ? (
            <div className="flex flex-col items-center gap-5 py-6 text-center success-pop">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-9 w-9 text-primary" aria-hidden />
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-bold text-foreground">{t("inscription.success")}</p>
                <p className="type-caption">
                  {t("inscription.keepQr")} — {created.lastName} {created.firstName}
                </p>
              </div>
              <RegistrantQrCode
                registrant={created}
                size={180}
                downloadLabel={t("inscription.downloadQr")}
              />
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button type="button" onClick={() => setCreated(null)}>
                  {t("inscription.registerAnother")}
                </Button>
                <Button asChild variant="outline">
                  <Link to={context.backTo}>{context.backLabel}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className={`space-y-6 ${textAlign}`}
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="lastName">
                    {t("inscription.lastName")}
                  </label>
                  <Input
                    id="lastName"
                    dir={dir}
                    aria-invalid={!!errors.lastName}
                    {...register("lastName", { required: t("inscription.lastNameRequired") })}
                    placeholder={t("inscription.lastNamePlaceholder")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive" role="alert">{errors.lastName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="firstName">
                    {t("inscription.firstName")}
                  </label>
                  <Input
                    id="firstName"
                    dir={dir}
                    aria-invalid={!!errors.firstName}
                    {...register("firstName", { required: t("inscription.firstNameRequired") })}
                    placeholder={t("inscription.firstNamePlaceholder")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive" role="alert">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="birthDate">
                    {t("inscription.birthDate")}
                  </label>
                  <Input
                    id="birthDate"
                    type="date"
                    aria-invalid={!!errors.birthDate}
                    {...register("birthDate", { required: t("inscription.birthDateRequired") })}
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-destructive" role="alert">{errors.birthDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground" htmlFor="birthPlace">
                    {t("inscription.birthPlace")}
                  </label>
                  <Input
                    id="birthPlace"
                    dir={dir}
                    aria-invalid={!!errors.birthPlace}
                    {...register("birthPlace", { required: t("inscription.birthPlaceRequired") })}
                    placeholder={t("inscription.birthPlacePlaceholder")}
                  />
                  {errors.birthPlace && (
                    <p className="text-xs text-destructive" role="alert">{errors.birthPlace.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="nationalId">
                  {t("inscription.nationalId")}
                </label>
                <Input
                  id="nationalId"
                  inputMode="numeric"
                  maxLength={18}
                  aria-invalid={!!errors.nationalId}
                  {...register("nationalId", {
                    required: t("inscription.nationalIdRequired"),
                    pattern: {
                      value: /^\d{18}$/,
                      message: t("inscription.nationalIdPattern"),
                    },
                  })}
                  placeholder={t("inscription.nationalIdPlaceholder")}
                />
                {errors.nationalId && (
                  <p className="text-xs text-destructive" role="alert">{errors.nationalId.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full"
              >
                {isSubmitting ? t("common.loading") : t("inscription.submit")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
