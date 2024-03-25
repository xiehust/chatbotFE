import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import NotFound from './pages/commons/not-found';
import {SimpleNotifications} from "./pages/commons/use-notifications";
import { ProvideAuth, useAuthSignout} from "./pages/commons/use-auth";
import LoginPage from "./pages/login/login";
import  {RequireAuth} from './pages/commons/private-route';
import UserApp from "./pages/admin/user/user-table.index"
import AddUserApp from "./pages/admin/adduser/adduser";
import "@cloudscape-design/global-styles/index.css";

import FeedbackTable from "./pages/feedback/feedback-servertable.index";

import PromptHubTable from "./pages/prompt_hub/prompt.index";
import CreatePromptApp from "./pages/prompt_hub/create-prompt";
import PromptDetail from "./pages/prompt_hub/prompt-detail";
import PromptChat from "./pages/prompt_playground";
import ModelHubTable from "./pages/model_hub/model.index";
import CreateModelApp from "./pages/model_hub/create-model";
import ModelCardDetail from "./pages/model_hub/model-detail";
import PEPlayCard from "./pages/prompt_hub/pecard.index";

export default function App() {
  return (

    <Router>
        <ProvideAuth>
       <SimpleNotifications>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path="/login" element={<LoginPage/>} />


          <Route path="/prompt_hub" element={<RequireAuth redirectPath="/login"><PromptHubTable/></RequireAuth>}/>
          <Route path="/prompt_hub/create" element={<RequireAuth redirectPath="/login"><CreatePromptApp/></RequireAuth>}/>
          <Route path="/prompt_hub/:templateId" element={<RequireAuth redirectPath="/login"><PromptDetail/></RequireAuth>}/>
          <Route path="/prompt_playground/:id" element={<RequireAuth redirectPath="/login"><PromptChat/></RequireAuth>}/>
          <Route path="/prompt_playground" element={<RequireAuth  redirectPath="/login"><PEPlayCard/></RequireAuth>}/>

          <Route path="/model_hub" element={<RequireAuth redirectPath="/login"><ModelHubTable/></RequireAuth>}/>
          <Route path="/model_hub/create" element={<RequireAuth redirectPath="/login"><CreateModelApp/></RequireAuth>}/>
          <Route path="/model_hub/:Id" element={<RequireAuth redirectPath="/login"><ModelCardDetail/></RequireAuth>}/> 

          <Route path="/feedback" element={<RequireAuth redirectPath="/login"><FeedbackTable/></RequireAuth>}/>
          <Route path="/admin/user" element={<RequireAuth  requireAdmin redirectPath="/login"><UserApp/></RequireAuth>}/>
          <Route path="/admin/adduser" element={<RequireAuth requireAdmin redirectPath="/login"><AddUserApp/></RequireAuth>}/>

          <Route path="/signout" element={<SignOut/>}/>
          <Route path="*" element={<NotFound/>} />
        </Routes>   
        </SimpleNotifications>
    </ProvideAuth>
    </Router>

  );
}

function SignOut(){
  const signout = useAuthSignout();
  const navigate = useNavigate();
  useEffect(()=>{
    navigate("/login");
    signout();
  },[])
  return <h1>sign out</h1>;
}

