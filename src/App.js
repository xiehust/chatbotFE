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
import ChatBot from "./pages/chatbot/chatmain";
import DocsTable from "./pages/docs/docs.index";
import UserApp from "./pages/admin/user/user-table.index"
import AddUserApp from "./pages/admin/adduser/adduser";
import "@cloudscape-design/global-styles/index.css";
import TemplateTable from './pages/template/template.index';
import CreateTemplateApp from "./pages/template/create-template";
import TemplateDetail from "./pages/template/template-detail-new";
import FeedbackTable from "./pages/feedback/feedback-servertable.index";
import ExamplesTable from "./pages/examples/docs.index";
import AgentsTable from "./pages/agents/agents.index";
import CreateAgentApp from "./pages/agents/create-agent";
import AgentDetail from "./pages/agents/agent-detail";
import AgentsChat from "./pages/agents_chat";
import AgentsCards from "./pages/agents/agents.cards.index";
import PromptHubTable from "./pages/prompt_hub/prompt.index";
import CreatePromptApp from "./pages/prompt_hub/create-prompt";
import PromptDetail from "./pages/prompt_hub/prompt-detail";
import PromptChat from "./pages/prompt_playground";
// import PromptHubCards from "./pages/prompt_hub/prompthub.cards.index";

export default function App() {
  return (

    <Router>
        <ProvideAuth>
       <SimpleNotifications>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/chat" element={<RequireAuth redirectPath="/login"><ChatBot/></RequireAuth>}/>
          <Route path="/agents" element={<RequireAuth redirectPath="/login"><AgentsCards/></RequireAuth>}/>
          <Route path="/agents/create" element={<RequireAuth redirectPath="/login"><CreateAgentApp/></RequireAuth>}/>
          <Route path="/agents/:agentId" element={<RequireAuth redirectPath="/login"><AgentDetail/></RequireAuth>}/>
          <Route path="/agentschat/:agentId" element={<RequireAuth redirectPath="/login"><AgentsChat/></RequireAuth>}/>

          <Route path="/prompt_hub" element={<RequireAuth redirectPath="/login"><PromptHubTable/></RequireAuth>}/>
          <Route path="/prompt_hub/create" element={<RequireAuth redirectPath="/login"><CreatePromptApp/></RequireAuth>}/>
          <Route path="/prompt_hub/:templateId" element={<RequireAuth redirectPath="/login"><PromptDetail/></RequireAuth>}/>
          <Route path="/prompt_playground/:id" element={<RequireAuth redirectPath="/login"><PromptChat/></RequireAuth>}/>

          <Route path="/docs" element={<RequireAuth redirectPath="/login"><DocsTable/></RequireAuth>}/>
          <Route path="/examples" element={<RequireAuth redirectPath="/login"><ExamplesTable/></RequireAuth>}/>
          <Route path="/template" element={<RequireAuth redirectPath="/login"><TemplateTable/></RequireAuth>}/>
          <Route path="/feedback" element={<RequireAuth redirectPath="/login"><FeedbackTable/></RequireAuth>}/>
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

