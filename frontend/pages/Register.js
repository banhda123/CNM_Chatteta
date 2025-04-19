import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from "@mui/material";
import AuthService from "../services/AuthService";

const steps = ['Thông tin cơ bản', 'Xác thực OTP', 'Hoàn tất'];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleNext = async () => {
    setError('');
    setLoading(true);

    try {
      if (activeStep === 0) {
        // Đăng ký tài khoản
        const registerResult = await AuthService.register(name, phone, password);
        if (registerResult.success) {
          // Gửi OTP
          const otpResult = await AuthService.sendOTP(phone);
          if (otpResult.success) {
            setActiveStep(1);
          } else {
            throw new Error(otpResult.error || 'Không thể gửi mã OTP');
          }
        } else {
          throw new Error(registerResult.error || 'Đăng ký thất bại');
        }
      } else if (activeStep === 1) {
        // Xác thực OTP
        const verifyResult = await AuthService.verifyOTP(phone, otp);
        if (verifyResult.success) {
          setActiveStep(2);
        } else {
          throw new Error(verifyResult.error || 'Mã OTP không đúng');
        }
      } else if (activeStep === 2) {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error(error);
      setError(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Họ và tên"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại"
              variant="outlined"
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
              label="Mật khẩu"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>
              Mã OTP đã được gửi đến số điện thoại {phone}
            </Typography>
            <TextField
              fullWidth
              label="Mã OTP"
              variant="outlined"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>
              Đăng ký thành công! Nhấn "Hoàn tất" để chuyển đến trang đăng nhập.
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
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
            Đăng ký
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}

          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
            >
              Quay lại
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                activeStep === steps.length - 1 ? 'Hoàn tất' : 'Tiếp tục'
              )}
            </Button>
          </Box>

          <Typography align="center" sx={{ mt: 2 }}>
            Đã có tài khoản?{' '}
            <Button
              color="primary"
              onClick={() => navigation.navigate('Login')}
            >
              Đăng nhập
            </Button>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
