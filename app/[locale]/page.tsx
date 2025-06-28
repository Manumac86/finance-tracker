import {
  ArrowRight,
  BarChart3,
  DollarSign,
  LineChart,
  PiggyBank,
  Shield,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const tNav = await getTranslations("navigation");
  const tLanding = await getTranslations("landing");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-semibold"
        >
          <DollarSign className="h-6 w-6 text-emerald-500" />
          <span>{tCommon("appName")}</span>
        </Link>
        <nav className="ml-auto hidden gap-4 sm:flex">
          <Link
            href={`/${locale}/dashboard`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {tNav("dashboard")}
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {tLanding("navigation.pricing")}
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {tLanding("navigation.about")}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 sm:ml-0">
          <Link href={`/${locale}/signin`}>
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
            >
              {tLanding("navigation.signIn")}
            </Button>
          </Link>
          <Link href={`/${locale}/signup`}>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {tLanding("navigation.signUp")}
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 justify-center">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container w-full px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    {tLanding("hero.title")}
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    {tLanding("hero.subtitle")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href={`/${locale}/signup`}>
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                      {tLanding("hero.getStarted")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/${locale}/dashboard`}>
                    <Button
                      variant="outline"
                      className="border-border hover:bg-accent"
                    >
                      {tLanding("hero.viewDemo")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl border bg-card p-2 shadow-xl">
                  <Image
                    src="/dashboard-preview.png"
                    alt="Dashboard Preview"
                    width={800}
                    height={600}
                    className="h-full w-full rounded-lg object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full bg-secondary py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-emerald-500/20 px-3 py-1 text-sm text-emerald-500">
                  {tLanding("features.badge")}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  {tLanding("features.title")}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {tLanding("features.subtitle")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <BarChart3 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">
                  {tLanding("features.expenseTracking.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tLanding("features.expenseTracking.description")}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <LineChart className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">
                  {tLanding("features.financialInsights.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tLanding("features.financialInsights.description")}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <PiggyBank className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">
                  {tLanding("features.savingsGoals.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tLanding("features.savingsGoals.description")}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">
                  {tLanding("features.incomeMonitoring.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tLanding("features.incomeMonitoring.description")}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">
                  {tLanding("features.secureData.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tLanding("features.secureData.description")}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">
                  {tLanding("features.budgetPlanning.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tLanding("features.budgetPlanning.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-emerald-500/20 px-3 py-1 text-sm text-emerald-500">
                  {tLanding("testimonials.badge")}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  {tLanding("testimonials.title")}
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {tLanding("testimonials.subtitle")}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col justify-between space-y-4 rounded-lg border bg-card p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    &quot;{tLanding("testimonials.testimonial1.quote")}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {tLanding("testimonials.testimonial1.name")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tLanding("testimonials.testimonial1.role")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between space-y-4 rounded-lg border bg-card p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    &quot;{tLanding("testimonials.testimonial2.quote")}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {tLanding("testimonials.testimonial2.name")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tLanding("testimonials.testimonial2.role")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between space-y-4 rounded-lg border bg-card p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    &quot;{tLanding("testimonials.testimonial3.quote")}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {tLanding("testimonials.testimonial3.name")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tLanding("testimonials.testimonial3.role")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-secondary py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                {tLanding("cta.title")}
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {tLanding("cta.subtitle")}
              </p>
            </div>
            <div className="mx-auto flex flex-col gap-2 min-[400px]:flex-row">
              <Link href={`/${locale}/signup`}>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {tLanding("cta.getStartedFree")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#">
                <Button
                  variant="outline"
                  className="border-border hover:bg-accent"
                >
                  {tLanding("cta.learnMore")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-background py-6 md:py-8 w-full flex justify-center">
        <div className="w-full flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-medium">
              {tLanding("footer.copyright")}
            </p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:underline">
              {tLanding("footer.terms")}
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:underline">
              {tLanding("footer.privacy")}
            </Link>
            <Link href="#" className="text-xs text-muted-foreground hover:underline">
              {tLanding("footer.contact")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
