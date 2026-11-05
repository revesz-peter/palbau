import { useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import { getCalUrl, site } from "@/lib/site"

import { ContactForm } from "./contact-form"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

export function Contact() {
  const t = useTranslations("contact")
  const showroom = useTranslations("showroom")
  const calUrl = getCalUrl()

  return (
    <section id="kapcsolat" aria-labelledby="contact-title">
      <div className="mx-auto max-w-[100rem] px-5 pb-14 md:px-10 md:pb-28">
        <SectionHeading
          id="contact-title"
          number={t("number")}
          title={t("title")}
        />
        <div className="mt-6 grid grid-cols-12 gap-x-2 gap-y-8 md:mt-16 md:gap-x-6 md:gap-y-10 lg:grid-rows-[auto_1fr]">
          <Reveal className="col-span-12 lg:col-span-4 lg:col-start-3 lg:row-start-1 lg:pr-6">
            <p className="max-w-[36ch] text-xl leading-normal text-pretty">
              {t("body")}
            </p>
            {calUrl ? (
              <div className="mt-8">
                <a
                  href={calUrl}
                  className={buttonVariants({
                    size: "lg",
                    className: "h-14 px-7 text-lg",
                  })}
                >
                  {t("book")}
                </a>
                <p className="mt-3 text-base">{t("bookNote")}</p>
              </div>
            ) : null}
            {site.phone || site.email ? (
              <dl className="mt-10 space-y-4">
                {site.phone ? (
                  <div>
                    <dt className="text-base">{t("phoneLabel")}</dt>
                    <dd>
                      <a
                        href={`tel:${site.phone.replace(/\s/g, "")}`}
                        className="text-2xl font-semibold underline underline-offset-4"
                      >
                        {site.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {site.email ? (
                  <div>
                    <dt className="text-base">{t("emailLabel")}</dt>
                    <dd>
                      <a
                        href={`mailto:${site.email}`}
                        className="text-2xl font-semibold underline underline-offset-4"
                      >
                        {site.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
            <ContactForm />
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-4 lg:col-start-3 lg:row-start-2 lg:pr-6">
            <div className="border-t border-border pt-6">
              <h3 className="text-xl font-semibold">{showroom("title")}</h3>
              <p className="mt-2 max-w-[42ch] text-lg text-pretty">
                {showroom("body")}
              </p>
              <p className="mt-3 max-w-[42ch] text-lg text-pretty">
                {site.showroomAddress ?? showroom("addressPending")}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
