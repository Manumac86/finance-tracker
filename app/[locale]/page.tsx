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

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-950 text-gray-50 ">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-950/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          <span>FinTrack</span>
        </Link>
        <nav className="ml-auto hidden gap-4 sm:flex">
          <Link
            href="/features"
            className="text-sm font-medium text-gray-400 hover:text-gray-50"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-400 hover:text-gray-50"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-gray-400 hover:text-gray-50"
          >
            About
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4 sm:ml-0">
          <Link href="/signin">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Sign Up
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
                    Take Control of Your Finances
                  </h1>
                  <p className="max-w-[600px] text-gray-400 md:text-xl">
                    Track expenses, monitor income, and achieve your financial
                    goals with our intuitive finance tracker.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="border-gray-800 hover:bg-gray-900"
                    >
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-2 shadow-xl">
                  <Image
                    src="/dashboard-preview.png"
                    alt="Dashboard Preview"
                    width={800}
                    height={600}
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent opacity-60"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full bg-gray-900 py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-emerald-500/20 px-3 py-1 text-sm text-emerald-500">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need
                </h2>
                <p className="max-w-[900px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our finance tracker provides all the tools you need to manage
                  your money effectively.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <BarChart3 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Expense Tracking</h3>
                <p className="text-sm text-gray-400">
                  Easily track and categorize your expenses to understand your
                  spending habits.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <LineChart className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Financial Insights</h3>
                <p className="text-sm text-gray-400">
                  Get detailed charts and analytics to visualize your financial
                  progress over time.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <PiggyBank className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Savings Goals</h3>
                <p className="text-sm text-gray-400">
                  Set and track savings goals to help you achieve your financial
                  objectives.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Income Monitoring</h3>
                <p className="text-sm text-gray-400">
                  Track multiple income sources and understand your earning
                  patterns.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Secure Data</h3>
                <p className="text-sm text-gray-400">
                  Your financial data is encrypted and securely stored for your
                  peace of mind.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-950 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">Budget Planning</h3>
                <p className="text-sm text-gray-400">
                  Create and manage budgets to keep your spending in check and
                  reach your goals.
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
                  Testimonials
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  What Our Users Say
                </h2>
                <p className="max-w-[900px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of users who have transformed their financial
                  lives with FinTrack.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col justify-between space-y-4 rounded-lg border border-gray-800 bg-gray-950 p-6">
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
                  <p className="text-sm text-gray-400">
                    &quot;FinTrack has completely changed how I manage my money. I
                    can now see exactly where my money goes and make better
                    financial decisions.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-800"></div>
                  <div>
                    <p className="text-sm font-medium">Alex Johnson</p>
                    <p className="text-xs text-gray-400">Software Developer</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between space-y-4 rounded-lg border border-gray-800 bg-gray-950 p-6">
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
                  <p className="text-sm text-gray-400">
                    &quot;I&apos;ve tried many finance apps, but FinTrack is by far the
                    most intuitive and comprehensive. The visual charts make it
                    easy to understand my finances.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-800"></div>
                  <div>
                    <p className="text-sm font-medium">Sarah Miller</p>
                    <p className="text-xs text-gray-400">Marketing Manager</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between space-y-4 rounded-lg border border-gray-800 bg-gray-950 p-6">
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
                  <p className="text-sm text-gray-400">
                    &quot;Since using FinTrack, I&apos;ve been able to save an extra $400
                    per month. The insights it provides are invaluable for
                    financial planning.&quot;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-800"></div>
                  <div>
                    <p className="text-sm font-medium">Michael Chen</p>
                    <p className="text-xs text-gray-400">
                      Small Business Owner
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-gray-900 py-12 md:py-24 lg:py-32 flex justify-center">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Transform Your Finances?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users who have taken control of their
                financial future with FinTrack.
              </p>
            </div>
            <div className="mx-auto flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  variant="outline"
                  className="border-gray-800 hover:bg-gray-900"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-800 bg-gray-950 py-6 md:py-8 w-full flex justify-center">
        <div className="w-full flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-medium">FinTrack © 2024</p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/terms"
              className="text-xs text-gray-400 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="text-xs text-gray-400 hover:underline"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
