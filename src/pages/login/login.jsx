// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, {useEffect, useState} from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAuth } from '../commons/use-auth';
import {useNavigate} from 'react-router-dom';
import { useLocalStorage } from "../../common/localStorage";
import {localStoreKey} from '../../common/shared'
import { blue, deepPurple } from '@mui/material/colors';
import StepLabel from '@mui/material/StepLabel';
import Step from '@mui/material/Step';
import Stepper from '@mui/material/Stepper';
import { useTranslation } from "react-i18next";
import { initiateOAuthLogin } from '../../common/oauth-utils';



function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="">
        {'GCR GenAI Juggle Hub'}
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const theme = createTheme({
  // palette: {
  //   primary: blue,
  //   secondary: deepPurple,
  // },  
});

const SignUpSteps = ({activeStep}) =>{
  const steps = ['Get your confirm code from email', 'Input your confirm code','Registeration Success'];

  return (
    <Stepper activeStep={activeStep} alternativeLabel>
  {steps.map((label) => (
    <Step key={label}>
      <StepLabel>{label}</StepLabel>
    </Step>
  ))}
</Stepper>
  )


}

const LoginPage = ()=>{
  const [session, setSession] = useState();
  const [signType, setSignType] = useState('signin');
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  return (
    // signType === 'signin'?
    <SignIn setSession={setSession} signType={signType} setSignType={setSignType} username={username} setUsername={setUsername} password={password} setPassword={setPassword}/>
    // :<SignUp setSession={setSession} setSignType={setSignType} username={username} setUsername={setUsername} password={password} setPassword={setPassword}/>
  )
}

const SignUp = ({setSignType,username,setUsername,password,setPassword}) =>{
  const auth = useAuth();
  const [local_stored_crediential,setLocalStoredCred] = useLocalStorage('chatbot-local-credentials',null)
  const [errorstate, setErrorState] = useState(false);
  const [errormsg, setErrMsg] = useState('');
  // const [username, setUsername] = useState();
  // const [password, setPassword] = useState();

  const [email, setEmail] = useState();
  const [activeStep, setActiveStep] = useState(0);
  const [confirmCode , setConfirmCode] = useState();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = auth.user && auth.user.isAuthorized;
  useEffect(()=>{
        if(isAuthenticated){
            navigate('/chat');
        }
    },[navigate,isAuthenticated]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorState(false);
    setErrMsg('');
    const formdata = new FormData(event.currentTarget);
    if (activeStep === 0){
      if (!formdata.get('username') || !formdata.get('email')){
        setErrorState(true);
        setErrMsg('Need username and email address');
        return;
      }
      setLoading(true);
      auth.signup(formdata.get('username'),formdata.get('email'),formdata.get('password'))
      .then((data)=>{
        setLocalStoredCred({username:formdata.get('username'),
                      password:formdata.get('password'),
                     email:formdata.get('email')});
          console.log(data);
          setActiveStep(1);
          setLoading(false);
      })  
      .catch(error =>{ 
        console.log(error);
        setErrorState(true);
        setErrMsg(error.response?.data);
        setLoading(false);
      })
    }else if (activeStep === 1){
      if (!formdata.get('confirmcode')){
        setErrorState(true);
        setErrMsg('Need confrim code from you email');
        return;
      }
      setLoading(true);
      auth.confirm_signup(formdata.get('username'),formdata.get('confirmcode'))
      .then((data)=>{
          console.log(data);
          setActiveStep(2);
          setLoading(false);
          setTimeout(()=>setSignType('signin'),2000);
      })  
      .catch(error =>{ 
        setErrorState(true);
        setErrMsg(error.response.data);
        setLoading(false);
      })

    }


  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs" >
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'warning.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign Up
          </Typography>
         
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <FormControl sx={{width:360}}>
            <TextField
              error = {errorstate}
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              value ={username??''}
              onChange = {(event) => { setUsername(event.target.value);}}
              autoFocus
            />
            <TextField
              error = {errorstate}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              value ={email??''}
              onChange = {(event) => { setEmail(event.target.value);}}
              // autoFocus
            />
            <TextField
              error = {errorstate}
              helperText ={errormsg}
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value ={password??''}
              onChange = {(event) => { setPassword(event.target.value);}}
              autoComplete="current-password"
            />
            {activeStep? 
              <TextField
              error = {errorstate}
              helperText ={errormsg}
              margin="normal"
              required
              fullWidth
              name="confirmcode"
              label="Confirm code"
              id="confirmcode"
              value ={confirmCode??''}
              onChange = {(event) => { setConfirmCode(event.target.value);}}
            />:<div/>
 
            }
            <SignUpSteps activeStep={activeStep}/>
            {
              activeStep === 0?
              <LoadingButton
              type="submit"
              loading = {loading}
              fullWidth
              variant="contained"
              color='secondary'
              sx={{ mt: 3, mb: 2,}}
            >
              {"Sign Up"}
            </LoadingButton>
            :
            <LoadingButton
              type="submit"
              loading = {loading}
              fullWidth
              variant="contained"
              color='warning'
              sx={{ mt: 3, mb: 2,}}
            >
              {"Confirm"}
            </LoadingButton>
            }
            
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#" variant="body2" onClick={()=>setSignType('signin')}>
                  {"Already have an account. Sign In"}
                </Link>
              </Grid>
            </Grid>
            </FormControl>
          </Box>

        </Box>
        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
}

const SignIn = ({setSession,signType,setSignType,username,setUsername,password,setPassword}) => {
  const auth = useAuth();
  const {t} = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = auth.user && auth.user.isAuthorized;

  useEffect(()=>{
        if(isAuthenticated){
            navigate('/prompt_hub');
        }
    },[navigate,isAuthenticated]);


  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: 'url(/background.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container component="main" maxWidth="xs" >
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: 4,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'warning.main' }}>
              <LockOutlinedIcon />
            </Avatar>
          <Typography component="h1" variant="h5">
            Juggle Hub {t('signin')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3, textAlign: 'center' }}>
            Sign in with your Amazon Midway account to access the platform
          </Typography>

          <Box sx={{ mt: 1, width: '100%' }}>
            <FormControl sx={{width: '100%'}}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  backgroundColor: '#FF9900',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#EC7211',
                  }
                }}
                onClick={initiateOAuthLogin}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M14.82 12.93c-.03.24-.47.34-.86.37-.38.03-.7-.01-.67-.25.03-.24.41-.34.8-.37.39-.03.76.01.73.25M15.19 13.88c-.03.24-.62.34-1.31.22s-1.23-.38-1.2-.62.62-.32 1.31-.2 1.23.36 1.2.6M13.11 10.86s-.31-.08-.31-.21.28-.21.63-.21.64.08.64.21-.28.21-.63.21-.33 0-.33 0" fill="white"/>
                    <path d="M17.36 13.85c-.76 1.23-2.4 1.97-4.31 1.97-2.05 0-3.89-.76-5.29-2.01-.11-.1-.01-.24.12-.16 1.52.89 3.4 1.43 5.34 1.43 1.31 0 2.74-.27 4.06-.83.2-.08.36.13.18.29M17.73 13.4c-.1-.13-.65-.06-.9-.03-.07.01-.08-.06-.02-.11.44-.31 1.16-.22 1.24-.12.08.11-.02.85-.45 1.2-.07.06-.13.03-.1-.05.09-.23.29-.74.19-.87" fill="white"/>
                    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none"/>
                  </svg>
                  Sign in with Midway
                </Box>
              </Button>
            {/* <Button
             fullWidth
              variant="contained"
              sx={{ mt: 0.5, mb: 0.5}}
              color = "secondary"
              onClick={()=>setSignType('signup')}
              >
              {"Sign Up"}
            </Button> */}
            {/* <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#" variant="body2" onClick={()=>setSignType('signup')}>
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid> */}
            </FormControl>
          </Box>

          </Box>
          <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default LoginPage;