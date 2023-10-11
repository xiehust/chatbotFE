// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState, useRef } from "react";
import { Container, Header, SpaceBetween,Button } from "@cloudscape-design/components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
// import { CopyBlock,a11yDark } from "react-code-blocks";
import { useChatData, generateUniqueId } from "./common-components";
import { useTranslation } from "react-i18next";
import botlogo from "../../resources/Res_Amazon-SageMaker_Model_48_Light.svg";
import { useAuthToken,useAuthUserInfo} from "../commons/use-auth";
import useWebSocket from "react-use-websocket";
import { API_socket,postFeedback } from "../commons/api-gateway";
import PromptPanel from "./prompt-panel";
import { useLocalStorage } from '../../common/localStorage';
import {params_local_storage_key} from "../chatbot/common-components";

import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

import {
  Box,
  Stack,
  Avatar,
  List,
  ImageListItem,
  ImageList,
  ListItem,
  ImageListItemBar,
  Grid
} from "@mui/material";
import { grey } from "@mui/material/colors";

const BOTNAME = "AI";
const MAX_CONVERSATIONS = 6;

function stringToColor(string) {
  let hash = 0;
  let i;
  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */
  return color;
}

function stringAvatar(name) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    //   children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
    children: name[0].toUpperCase() + name[name.length - 1].toUpperCase(),
  };
}

function extractImagTag(text) {
  const imageRegex = /<img>(.*?)<\/img>/g;
  const matches = text.matchAll(imageRegex);
  const newtext = text.replaceAll(imageRegex, "");
  let imagePaths = [];
  for (const match of matches) {
    const imagePath = match[1];
    imagePaths.push(imagePath);
  }
  return [imagePaths, newtext];
}

function formatImg2MD(text) {
  const imageRegex = /<img>(.*?)<\/img>/g;
  const matches = text.matchAll(imageRegex);
  let imagePaths = [];
  let newtext = text;
  for (const match of matches) {
    const url = match[1];
    newtext=newtext.replaceAll(`<img>${url}</img>`, `![${url}](${url}" target="_blank)`);
    imagePaths.push(url);
  }
  return [imagePaths, newtext];
}

const MarkdownToHtml = ({ text }) => {
  return <ReactMarkdown children={text} remarkPlugins={[gfm]}
    components={{
      code({node, inline, className, children, ...props}) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
          <SyntaxHighlighter
            {...props}
            children={String(children).replace(/\n$/, '')}
            style={a11yDark}
            wrapLongLines
            language={match[1]}
            PreTag="div"
          />
        ) : (
          <code {...props} className={className}>
            {children}
          </code>
        );
      },
      img: (image) => (
            <img
              src={image.src || ""}
              alt={image.alt || ""}
              width={500}
              loading="lazy"
                  sx={{
                    objectFit: "contain",
                  }}
            />
          ),
      
    }}
  />;
};

const MsgItem = ({ who, text, image,msgid,connectionId  }) => {
  if (image) {
    const url = URL.createObjectURL(image);
    return (
      who !== BOTNAME && (
        <ListItem sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
            <ImageList
              sx={{ width: 500, height: "auto", objectFit: "contain" }}
              cols={1}
            >
              <ImageListItem key={image.name}>
                <img
                  src={url}
                  alt={image.name}
                  loading="lazy"
                  sx={{
                    objectFit: "contain",
                  }}
                />
                <ImageListItemBar
                  title={image.name}
                  subtitle={
                    <span>size: {(image.size / 1024).toFixed(1)}KB</span>
                  }
                  position="below"
                />
              </ImageListItem>
            </ImageList>
            <Avatar {...stringAvatar(who)} />
          </Stack>
        </ListItem>
      )
    );
  } else {
    let newlines = [];
    if (who === BOTNAME) {
      const [imgPaths, newtext] =  formatImg2MD(text);
      newlines.push(newtext);
    } else {
      newlines = [text]
    }
    // console.log(text);

    return who !== BOTNAME ? (
      <ListItem sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
          <TextItem sx={{ bgcolor: "#f2fcf3", borderColor: "#037f0c" }}>
            <MarkdownToHtml text = {newlines.join(' ')}/>
          </TextItem>

          <Avatar {...stringAvatar(who)} />
        </Stack>
      </ListItem>
    ) : (

      <ListItem>
        <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
          <Avatar src={botlogo} alt={"AIBot"} />
          <Grid container spacing={1}>
            <Grid item xs={11}>
              <TextItem>
                <MarkdownToHtml text ={newlines.join(' ')}/>
              </TextItem>
            </Grid>
            <Grid item xs={4}>
                <ThumbButtons msgid={msgid} session_id={connectionId} />
            </Grid>
          </Grid>
        </Stack>
      </ListItem>
    );
  }
};

const ThumbButtons = ({msgid,session_id}) =>{
  const [downFilled, setDownFilled] = useState(false);
  const [upFilled, setUpFilled] = useState(false);
  const [downLoading, setDownLoading] = useState(false);
  const [upLoading, setUpLoading] = useState(false);
  const token = useAuthToken();
  const userInfo = useAuthUserInfo();
  const headers = {
    Authorization: token.token,
  };
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;

  const handleClickDown = async()=>{
      const body = {
        msgid:msgid,
        session_id:session_id,
        main_fun_arn:main_fun_arn,
        apigateway_endpoint:apigateway_endpoint,
        username:userInfo.username,
        action: downFilled?'cancel-thumbs-down':'thumbs-down'
      }
      setDownLoading(true);
      try {
          const resp = await postFeedback(headers,body);
          setDownFilled(prev=>!prev);
          setUpFilled(false);
          setDownLoading(false);
      } catch (error) {
        console.log(error);
        setDownLoading(false);
      }
    }


  const handleClickUp = async()=>{
    const body = {
      msgid:msgid,
      session_id:session_id,
      main_fun_arn:main_fun_arn,
      apigateway_endpoint:apigateway_endpoint,
      username:userInfo.username,
      action: upFilled?'cancel-thumbs-up':'thumbs-up'
    }
    setUpLoading(true);
    try {
        const resp = await postFeedback(headers,body);
        setUpFilled(prev=>!prev);
        setDownFilled(false);
        setUpLoading(false);
    } catch (error) {
      console.log(error);
      setUpLoading(false);
    }
  }
  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Button
        ariaLabel="thumbs-down"
        iconAlign="right"
        loading={downLoading}
        iconName={downFilled?"thumbs-down-filled":"thumbs-down"}
        variant={downFilled?'primary':'normal'}
        target="_blank"
        onClick = {handleClickDown}
      >
      </Button>
      <Button
        ariaLabel="thumbs-up"
        iconAlign="right"
        loading={upLoading}
        iconName={upFilled?"thumbs-up-filled":"thumbs-up"}
        variant={upFilled?'primary':'normal'}
        target="_blank"
        onClick = {handleClickUp}
      >
      </Button>
    </SpaceBetween>
  )
}

const TextItem = (props) => {
  const { sx, ...other } = props;
  // console.log(other);
  return (
    <Box
      sx={{
        p: 1.2,
        // m: 1.2,
        whiteSpace: "normal",
        bgcolor: "#f2f8fd",
        color: grey[800],
        border: "2px solid",
        borderColor: "#0972d3",
        borderRadius: 2,
        fontSize: "14px",
        // maxWidth:"max-content",
        minWidth:'150px',
        width:"auto",
        fontWeight: "400",
        ...sx,
      }}
      {...other}
    />
  );
};

const ChatBox = ({ msgItems, loading }) => {
  const [loadingtext, setLoaderTxt] = useState(".");

  useEffect(() => {
    if (loading) {
      setLoaderTxt("Waiting.........");
      // handleStartTick();
    } else {
      setLoaderTxt("");
      // handleStopClick();
    }
  }, [loading]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behaviour: "smooth" });
    }
  }, [msgItems.length]);
  const items = msgItems.map((msg) => (
    <MsgItem
      key={generateUniqueId()}
      who={msg.who}
      text={msg.text}
      image={msg.image}
      msgid={msg.id}
      connectionId={msg.connectionId}
    />
  ));

  return (
    <List
      sx={{
        position: "relative",
        overflow: "auto",
      }}
    >
      {items}
      {loading ? (
        <MsgItem key={generateUniqueId()} who={BOTNAME} text={loadingtext} />
      ) : (
        <div />
      )}
      <ListItem ref={scrollRef} />
    </List>
  );
};

const ConversationsPanel = () => {
  const { t } = useTranslation();
  const {
    msgItems,
    setMsgItems,
    loading,
    setLoading,
    conversations,
    setImg2txtUrl,
    setConversations,
    setAlertOpen,
    hideRefDoc,
  } = useChatData();
  const [streamMsg, setStreamMsg] = useState("");
  const authtoken = useAuthToken();
  const onMessageCallback = ({ data }) => {
    setLoading(false);
    //save conversations
    const resp = JSON.parse(data);
    // console.log(resp);
    
    let chunck = resp.text.content;
    // console.log(resp);
    // 如果是none stream输出，则全部替换
    if (hideRefDoc) {
      const fullRefRegex = /```json\n#Reference([\w+#-]+)?\n([\s\S]*?)\n```/gm;
      chunck = chunck.replace(fullRefRegex, "");
    }

    // 如果是stream输出，则忽略这个内容
    const refRegex = /```json\n#Reference/gm;
    if (hideRefDoc && refRegex.exec(chunck)) {
      return;
    }
    if (resp.role) {
      setStreamMsg((prev) => prev + chunck);
      // if stream stop, save the whole message
      if (chunck === "[DONE]") {
        setConversations((prev) => [
          ...prev,
          { role: resp.role, content: streamMsg,connectionId:resp.connectionId },
        ]);

        //如果是SD模型返回的url，则保存起来
        const [imgPaths, newtext] = extractImagTag(streamMsg);
        imgPaths.map((url) => setImg2txtUrl(url));

        setStreamMsg("");
        // console.log(streamMsg);
        if (conversations.length > MAX_CONVERSATIONS) {
          setConversations(
            (prev) =>
              prev
                .slice(0, 1)
                .concat(prev.slice(conversations.length - MAX_CONVERSATIONS)) //prev.slice(0,1)是默认的第一条AI预设角色
          );
        }
      }
    }
    const targetItem = msgItems.filter((item) => item.id === resp.msgid);
    // console.log(targetItem);
    // console.log(streamMsg);
    if (!targetItem.length) {
      //创建一个新的item
      setMsgItems((prev) => [
        ...prev,
        { id: resp.msgid, who: BOTNAME, text: chunck,connectionId:resp.connectionId  },
      ]);
    } else {
      setMsgItems((prev) => [
        ...prev.slice(0, -1),
        { id: resp.msgid, who: BOTNAME, text: streamMsg,connectionId:resp.connectionId  },
      ]);
    }
  };

  // setup websocket
  const { sendMessage, sendJsonMessage, getWebSocket, readyState } =
    useWebSocket(API_socket, {
      queryParams: authtoken,
      onOpen: () => {
        setAlertOpen(false);
        setLoading(false);
      },
      onMessage: onMessageCallback,
      retryOnError: true,
      onClose: () => {
        setLoading(false);
        setAlertOpen(true);
        console.log("connection close");
      },
      onError: () => {
        setLoading(false);
        setAlertOpen(true);
        console.log("connection error");
      },
      shouldReconnect: (closeEvent) => {
        return true;
      },
      reconnectAttempts: 100,
      reconnectInterval: (attemptNumber) =>
        Math.min(Math.pow(2, attemptNumber) * 1000, 15000),
    });

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">{t("conversations")}</Header>}>
        <ChatBox msgItems={msgItems} loading={loading} />
      </Container>

      <PromptPanel sendMessage={sendJsonMessage} />
    </SpaceBetween>
  );
};

export default ConversationsPanel;
