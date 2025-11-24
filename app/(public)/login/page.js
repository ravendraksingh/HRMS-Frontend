"use client";

import {
  useState,
  useRef,
  useEffect,
  Suspense,
  useActionState,
  useContext,
} from "react";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useRouter } from "next/navigation";
import { internalApiClient } from "@/app/services/internalApiClient";
import { clientTokenStorage } from "@/lib/tokenStorage";
import { useAuth } from "@/components/common/AuthContext";

const LoginForm = () => {
  const usernameRef = useRef();
  const passwordRef = useRef();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { user, setContextUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const username = usernameRef.current.value || "";
    const password = passwordRef.current.value || "";

    try {
      const res = await internalApiClient.post("/api/auth/login", {
        username,
        password,
      });
      const data = res.data;
      if (data.user) {
        setContextUser(data.user);
      }
      // Store tokens based on storage type
      // Note: For cookie mode, tokens are set server-side via httpOnly cookies
      const storageType = clientTokenStorage.getStorageType();

      if (storageType !== "cookie") {
        // For localStorage/sessionStorage, store tokens client-side
        if (data.accessToken) {
          await clientTokenStorage.setAccessToken(data.accessToken);
          console.log(`Access token stored in ${storageType}`);
        }
        if (data.refreshToken) {
          await clientTokenStorage.setRefreshToken(data.refreshToken);
          console.log(`Refresh token stored in ${storageType}`);
        }

        // Wait for tokens to be stored
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        // For cookie mode, tokens are already set server-side
        // Just update memory cache if needed
        if (data.accessToken) {
          await clientTokenStorage.setAccessToken(data.accessToken);
          console.log("Access token set in httpOnly cookie");
        }
      }

      // Use router.push for SPA navigation (localStorage mode)
      router.push("/ess/employee-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const apiError =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";
      setError(`Login failed: ${apiError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center pt-[20vh] px-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <Label htmlFor="email" className="mb-3">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                ref={usernameRef}
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
                ref={passwordRef}
                type="password"
                defaultValue="ravendra"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full hover:cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            {error && <ErrorMessage message={error} />}
          </form>
        </CardContent>
      </Card>

      {/* Modal Spinner (shadcn/ui Dialog) */}
      <Dialog open={loading}>
        <DialogContent className="flex flex-col items-center gap-4 bg-white">
          <DialogTitle className="sr-only">Logging in</DialogTitle>
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <div id="login-dialog-desc" className="text-lg font-medium">
            Logging in...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
