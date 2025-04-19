import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
  CircularProgress,
} from "@mui/material";
import AuthService from "../services/AuthService";

const Login = ({ switchToRegister }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await AuthService.login(phone, password);

      if (result.success) {
        const userData = await AuthService.getUserData();
        if (userData?._id) {
          navigation.navigate("Chat", { userId: userData._id });
        } else {
          throw new Error("Failed to retrieve user data");
        }
      } else {
        throw new Error(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      await AuthService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: "16px" }}>
        <Typography variant="h5" gutterBottom align="center">
          Login
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }} align="center">
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Phone Number"
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />

          <TextField
            fullWidth
            label="Password"
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </Box>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Don't have an account?{" "}
          <Link component="button" onClick={switchToRegister}>
            Register
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;
