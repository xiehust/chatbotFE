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
import SignIn from "./pages/login/login";
import  {RequireAuth} from './pages/commons/private-route';
import ChatBot from "./pages/chatbot/chatmain";
import DocsTable from "./pages/docs/docs.index";
import UserApp from "./pages/admin/user/user-table.index"
import AddUserApp from "./pages/admin/adduser/adduser";
import "@cloudscape-design/global-styles/index.css";
import TemplateTable from './pages/template/template.index';
import CreateTemplateApp from "./pages/template/create-template";
import TemplateDetail from "./pages/template/template-detail";

export default function App() {
  return (

    <Router>
        <ProvideAuth>
       <SimpleNotifications>
        <Routes>
          <Route path="/" element={<SignIn/>} />
          <Route path="/login" element={<SignIn/>} />
          <Route path="/chat" element={<RequireAuth redirectPath="/login"><ChatBot/></RequireAuth>}/>
          <Route path="/docs" element={<RequireAuth redirectPath="/login"><DocsTable/></RequireAuth>}/>
          <Route path="/template" element={<RequireAuth redirectPath="/login"><TemplateTable/></RequireAuth>}/>
          <Route path="/template/create" element={<RequireAuth redirectPath="/login"><CreateTemplateApp/></RequireAuth>}/>
          <Route path="/template/:templateId" element={<RequireAuth redirectPath="/login"><TemplateDetail/></RequireAuth>}/>
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

