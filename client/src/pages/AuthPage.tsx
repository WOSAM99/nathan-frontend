import { useMemo, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Link,
  Stack,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import { IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

type FormValues = {
  fullName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

export default function AuthPage() {
const { showSnackbar } = useAppSnackbar();


  const { login, register: registerUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formValidation = useMemo(() => {
    return Yup.object().shape({
      fullName: isRegisterMode
        ? Yup.string()
            .trim()
            .required("Full name is required")
            .min(2, "Minimum 2 characters required")
            .max(40, "Maximum 40 characters allowed")
        : Yup.string().optional(),

      email: Yup.string()
        .required("Email is required")
        .email("Invalid email")
        .min(6, "Email must be at least 6 characters")
        .max(40, "Email cannot exceed 40 characters"),

      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),

      confirmPassword: isRegisterMode
        ? Yup.string()
            .required("Confirm password is required")
            .oneOf([Yup.ref("password")], "Passwords must match")
        : Yup.string().optional(),
    });
  }, [isRegisterMode]);

  const defaultValues = useMemo(
    () => ({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    }),
    [],
  );

  const methods = useForm<FormValues>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: yupResolver(formValidation),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: FormValues) => {
    if (isRegisterMode && data.password !== data.confirmPassword) {
      showSnackbar("Passwords do not match", "error");
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        await registerUser({
          email: data.email,
          password: data.password,
          full_name: data.fullName ?? "",
        });

        showSnackbar("Account created! Logging you in...", "success");
      } else {
        await login({
          email: data.email,
          password: data.password,
        });

        showSnackbar("Welcome back!", "success");
      }
    } catch (error: any) {
      showSnackbar(
        error?.message ||
          (isRegisterMode ? "Registration failed" : "Login failed"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8f9fa",
        flexDirection: "column",
        px: { xs: 2, sm: 3, md: 0 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: { xs: "100%", sm: 420 },
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: "#0b1320",
            borderRadius: 1,
            mx: "auto",
            mb: 2,
          }}
        />

        <Typography variant="overline" sx={{ letterSpacing: 2 }}>
          DESIGN AI WORKSPACE
        </Typography>

        <Typography
          sx={{
            mt: 1,
            mb: 3,
            fontWeight: 400,
            fontSize: { xs: "18px", sm: "22px" },
          }}
        >
          {isRegisterMode ? "Sign Up" : "Sign In"}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          {isRegisterMode && (
            <TextField
              variant="standard"
              label="Full Name"
              fullWidth
              margin="normal"
              {...register("fullName")}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
          )}

          <TextField
            variant="standard"
            label="Email Address"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            variant="standard"
            type={showPassword ? "text" : "password"}
            label="Password"
            fullWidth
            margin="normal"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isRegisterMode && (
            <TextField
              variant="standard"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm Password"
              fullWidth
              margin="normal"
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: { xs: 1.2, sm: 1.4 },
              bgcolor: "#0b1320",
              letterSpacing: 2,
              "&:hover": { bgcolor: "#0b1320" },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : isRegisterMode ? (
              "Create Account"
            ) : (
              "SIGN IN"
            )}
          </Button>
        </form>

        <Stack
          sx={{
            textAlign: "center",
            mt: 3,
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {isRegisterMode
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
          </Typography>
          <Link
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              reset();
            }}
            sx={{
              color: "black",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isRegisterMode ? "Sign in" : "Sign up"}
          </Link>
        </Stack>
      </Paper>

      <Typography
        variant="caption"
        sx={{
          mt: 2,
          letterSpacing: 2,
          opacity: 0.5,
          fontSize: { xs: "9px", sm: "10px" },
        }}
      >
        HIGH-END INTERIOR WORKSPACE v1.0
      </Typography>
    </Box>
  );
}
