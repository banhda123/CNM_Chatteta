import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import AuthService from "../services/AuthService";
import LoadingAnimation from "../components/LoadingAnimation";

const Login = () => {
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
        const userData = result.user || {};
        
        const userDataToStore = {
          _id: userData._id,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar || null
        };
        
        AuthService.setUserData(userDataToStore);
        
        if (userData._id) {
          window.location.reload();
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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRadius: "16px"
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Đăng nhập
          </Typography>
          
          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Số điện thoại"
              variant="outlined"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              required
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
            />
            
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingAnimation size={30} />
              ) : (
                "Đăng Nhập"
              )}
            </Button>

            <Typography align="center" sx={{ mt: 2 }}>
              Chưa có tài khoản?{' '}
              <Button
                color="primary"
                onClick={() => navigation.navigate('Register')}
              >
                Đăng ký
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
