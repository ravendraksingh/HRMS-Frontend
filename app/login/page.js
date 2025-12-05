"use client";

import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const LoginForm = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/login" method="POST">
          <div className="mb-5">
            <Label htmlFor="username" className="mb-3">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              type="text"
              defaultValue="ravendra@niyava.com"
              required
            />
          </div>

          <div className="mb-5">
            <Label htmlFor="password" className="mb-3">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              type="password"
              defaultValue="ravendra"
              required
            />
          </div>

          <Button type="submit" className="w-full hover:cursor-pointer">
            Login
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header - Logo and HRMS Title (Mobile only) */}
      <div className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 h-full">
          <Image
            src="/images/niyava-logo-with-details.png"
            alt="Organization Logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">HRMS</h1>
      </div>

      {/* Left Column - Organization Image (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/niyava-logo-with-details.png"
              alt="Organization Logo"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-lg text-gray-600">
            Sign in to access your HRMS account and manage your employee
            information.
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 pt-[15vh] lg:p-8">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

