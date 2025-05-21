"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputForm } from "@/components/ui/input/input-form";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginValuesType = z.infer<typeof loginFormSchema>;

const defaultValues: LoginValuesType = {
  email: "",
  password: "",
};

const LoginForm = () => {
  const router = useRouter();
  const { signIn } = useAuth();

  const form = useForm<LoginValuesType>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
  });

  async function handleLogin(values: LoginValuesType) {
    try {
      const { email, password } = values;
      
      // Show loading toast
      const loadingToast = toast.loading("Logging in...");
      
      const result = await signIn(email, password);
      
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.log("Login result:", result);
      
      // If result is undefined or null, handle that case
      if (!result) {
        toast.error("Login failed. Please try again.");
        return;
      }

      const { error, success } = result;

      if (error) {
        toast.error(error);
        return;
      }

      if (success) {
        console.log("Login successful, preparing to redirect...");
        toast.success("Login successful!");
        
        try {
          console.log("Starting redirect process...");
          // Try immediate redirect first
          router.push("/");
          router.refresh();
          
          // Also set a backup timeout in case the immediate redirect doesn't work
          setTimeout(() => {
            console.log("Timeout redirect executing...");
            window.location.href = "/"; // Direct browser redirect as fallback
          }, 500);
        } catch (redirectError) {
          console.error("Error during redirect:", redirectError);
          // Force redirect as last resort
          window.location.href = "/";
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "An unexpected error occurred");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleLogin)}
        className="w-full flex flex-col gap-y-4"
      >
        <InputForm
          label="Email"
          name="email"
          placeholder="hello@example.com"
          description=""
          required
        />

        <InputForm
          type="password"
          label="Password"
          name="password"
          description=""
          required
        />

        <Button disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
