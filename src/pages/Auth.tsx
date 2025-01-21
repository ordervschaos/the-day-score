import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setShowOTP(true);
      toast({
        title: "Check your email",
        description: "We've sent you a login link and code",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto mt-20">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to KarmaTracker</CardTitle>
          <CardDescription>Sign in with your email to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {!showOTP ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter the code sent to your email</p>
              <InputOTP
                value={otp}
                onChange={(value) => setOtp(value)}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, idx) => (
                      <InputOTPSlot key={idx} {...slot} index={idx} />
                    ))}
                  </InputOTPGroup>
                )}
              />
              <Button onClick={verifyOTP} className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            We'll email you a magic link for a password-free sign in.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;