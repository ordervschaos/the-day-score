import { useState, useEffect } from "react";
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
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) {
      toast({
        title: "Please wait",
        description: `You can request another code in ${countdown} seconds`,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      
      if (error) {
        if (error.message.includes('rate_limit')) {
          const seconds = parseInt(error.message.match(/\d+/)?.[0] || "60");
          setCountdown(seconds);
          toast({
            title: "Please wait",
            description: `You can request another code in ${seconds} seconds`,
          });
        } else {
          throw error;
        }
      } else {
        setShowOTP(true);
        toast({
          title: "Check your email",
          description: "We've sent you a verification code",
        });
      }
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
      <Card className="w-full">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Welcome to KarmaTracker</CardTitle>
          <CardDescription className="text-lg">
            {showOTP ? "Enter the code sent to your email" : "Sign in with your email to continue"}
          </CardDescription>
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || countdown > 0}
              >
                {loading ? "Sending..." : countdown > 0 ? `Wait ${countdown}s` : "Send Code"}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-8">
              <InputOTP
                value={otp}
                onChange={(value) => setOtp(value)}
                maxLength={6}
                render={({ slots }) => (
                  <InputOTPGroup className="gap-4">
                    {slots.map((slot, idx) => (
                      <InputOTPSlot 
                        key={idx} 
                        {...slot} 
                        index={idx}
                        className="w-12 h-14 text-xl font-semibold border-2 rounded-md focus:border-primary focus:ring-2 focus:ring-primary"
                      />
                    ))}
                  </InputOTPGroup>
                )}
              />
              <Button 
                onClick={verifyOTP} 
                className="w-full py-6 text-lg font-semibold bg-gray-500 hover:bg-gray-600" 
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-base text-gray-600">
            We'll email you a verification code to sign in.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;