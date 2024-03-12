// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState, useRef,memo } from "react";
import {
  Container,
  Header,
  SpaceBetween,
  Button,
} from "@cloudscape-design/components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
// import { CopyBlock,a11yDark } from "react-code-blocks";
import { useChatData, generateUniqueId } from "./common-components";
import { useTranslation } from "react-i18next";
import botlogo from "../../../resources/Res_Amazon-SageMaker_Model_48_Light.svg";
import userlogo from "../../../resources/icons8-user-96.png"
import { useAuthToken, useAuthUserInfo } from "../../commons/use-auth";
import useWebSocket from "react-use-websocket";
import { API_socket, postFeedback } from "../../commons/api-gateway";
import PromptPanel from "./prompt-panel";
import { useLocalStorage } from "../../../common/localStorage";
import { params_local_storage_key } from "./common-components";
import AddFeedbackModal from "./addfeedback";
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
  Grid,
} from "@mui/material";
import { grey } from "@mui/material/colors";

const BOTNAME = "AI";
const MAX_CONVERSATIONS = 6;

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
    newtext = newtext.replaceAll(
      `<img>${url}</img>`,
      `![${url}](${url}" target="_blank)`
    );
    imagePaths.push(url);
  }
  return [imagePaths, newtext];
}

const MarkdownToHtml = ({ text }) => {
  return (
    <ReactMarkdown
      children={text}
      remarkPlugins={[gfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, "")}
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
            width={300}
            loading="lazy"
            sx={{
              objectFit: "contain",
            }}
          />
        ),
      }}
    />
  );
};


const ImageUrlItems = ({images})=>{

return (
  <ImageList
  key ={generateUniqueId()}
  sx={{ width: 1024, height: "auto", objectFit: "contain" }}
  cols={Math.max( 4)}
  // rowHeight={256}
>
  {images.map(image =>
    {
      try {
        const url = URL.createObjectURL(image);
        // const url = image;
        return (<ImageListItem key={generateUniqueId()}>
          <img
            src={url}
            alt={image.name}
            loading="lazy"
            sx={{
              objectFit: "contain",
            }}
          />
          <ImageListItemBar
            // title={image.name}
            subtitle={
              <span>size: {(image.size / 1024).toFixed(1)}KB</span>
            }
            // position="below"
          />
        </ImageListItem>)
      } catch (err) {
        return <div />;
      }
  }
  )}
</ImageList>
)

}
const MsgItem = ({ who, text, images_base64,images, msgid, connectionId }) => {
  const userInfo = useAuthUserInfo();
  const sessionId = `web_chat_${userInfo.username}_${connectionId}`

  //restore image file from localstorage
  if (images_base64){
    
    let key = 0;
    const imagesObj = images_base64.map( base64Data =>{
      const binaryString = window.atob(base64Data); // 将 base64 字符串解码为二进制字符串
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' }); 
       key ++;
        // Create a new File object from the Blob
        return new File([blob], `image_${key}.png`, { type: 'image/png' });
    });
    return (
      who !== BOTNAME && (
        <ListItem >
          <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
          <Avatar src={userlogo}  alt={"User"}/>
          <ImageUrlItems key={generateUniqueId()} images={imagesObj}/>
          </Stack>
        </ListItem>
      )
    );

  }
  else if (images) {

    return (
      who !== BOTNAME && (
        <ListItem >
          <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
          <Avatar src={userlogo}  alt={"User"}/>
          <ImageUrlItems key={generateUniqueId()}  images={images}/>
          </Stack>
        </ListItem>
      )
    );
  } else {
    let newlines = [];
    if (who === BOTNAME) {
      const [imgPaths, newtext] = formatImg2MD(text);
      newlines.push(newtext);
    } else {
      newlines = [text];
    }
    // console.log(text);

    return who !== BOTNAME ? (
      <ListItem >
        <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
          <Avatar src={userlogo}  alt={"User"}/>
          <Grid container spacing={0.1}>
            <TextItem sx={{ bgcolor: "#f2fcf3", borderColor: "#037f0c" }}>
              <MarkdownToHtml text={newlines.join(" ")} />
            </TextItem>
          </Grid>
        </Stack>
      </ListItem>
    ) : (
      <ListItem >
        <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
          <Avatar src={botlogo} alt={"AIBot"} />
          <Grid container spacing={0.1}>
            <Grid item xs={11}>
              <TextItem>
                <MarkdownToHtml text={newlines.join(" ")} />
              </TextItem>
            </Grid>
            <Grid item xs={11}>
              <ThumbButtons msgid={msgid} sessionId={sessionId} />
            </Grid>
          </Grid>
        </Stack>
      </ListItem>
    );
  }
};

const ThumbButtons = ({ msgid, sessionId }) => {
  const [downLoading, setDownLoading] = useState(false);
  const [upLoading, setUpLoading] = useState(false);
  const { setFeedBackModalVisible, setModalData } = useChatData();
  const token = useAuthToken();
  const { t } = useTranslation();
  const userInfo = useAuthUserInfo();
  const headers = {
    Authorization: token.token,
  };
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + userInfo.username,
    null
  );
  const [downFilled, setDownFilled] = useState(
    localStoredParams?.feedback !== undefined &&
      localStoredParams.feedback[msgid] &&
      localStoredParams.feedback[msgid].action === "thumbs-down"
      ? true
      : false
  );
  const [upFilled, setUpFilled] = useState(
    localStoredParams?.feedback !== undefined &&
      localStoredParams.feedback[msgid] &&
      localStoredParams.feedback[msgid].action === "thumbs-up"
      ? true
      : false
  );
  useEffect(() => {}, []);

  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;

  const handleClickDown = async () => {
    const body = {
      msgid: msgid,
      session_id: sessionId,
      main_fun_arn: main_fun_arn,
      apigateway_endpoint: apigateway_endpoint,
      username: userInfo.username,
      company: userInfo.company,
      action: downFilled ? "cancel-thumbs-down" : "thumbs-down",
    };
    setDownLoading(true);
    // setModalData(body);
    try {
      const resp = await postFeedback(headers, body);
      setDownFilled((prev) => !prev);
      setUpFilled(false);
      setDownLoading(false);
      setLocalStoredParams({
        ...localStoredParams,
        feedback: {
          ...localStoredParams.feedback,
          [msgid]: body,
        },
      });
    } catch (error) {
      console.log(error);
      setDownLoading(false);
    }
  };

  const handleClickUp = async () => {
    const body = {
      msgid: msgid,
      session_id: sessionId,
      main_fun_arn: main_fun_arn,
      apigateway_endpoint: apigateway_endpoint,
      username: userInfo.username,
      company: userInfo.company,
      action: upFilled ? "cancel-thumbs-up" : "thumbs-up",
    };
    setUpLoading(true);
    // setModalData(body);
    try {
      const resp = await postFeedback(headers, body);
      setUpFilled((prev) => !prev);
      setDownFilled(false);
      setUpLoading(false);
      setLocalStoredParams({
        ...localStoredParams,
        feedback: {
          ...localStoredParams.feedback,
          [msgid]: body,
        },
      });
    } catch (error) {
      console.log(error);
      setUpLoading(false);
    }
  };
  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Button
        iconAlign="right"
        loading={downLoading}
        iconName={downFilled ? "thumbs-down-filled" : "thumbs-down"}
        variant={downFilled ? "primary" : "normal"}
        target="_blank"
        onClick={handleClickDown}
      ></Button>
      <Button
        iconAlign="right"
        loading={upLoading}
        iconName={upFilled ? "thumbs-up-filled" : "thumbs-up"}
        variant={upFilled ? "primary" : "normal"}
        target="_blank"
        onClick={handleClickUp}
      ></Button>
      {/* <Button
        iconAlign="right"
        iconName="external"
        target="_blank"
        onClick={() => {
          const data = {
            msgid: msgid,
            session_id: sessionId,
            main_fun_arn: main_fun_arn,
            apigateway_endpoint: apigateway_endpoint,
            username: userInfo.username,
            company: userInfo.company,
            action: upFilled ? "thumbs-up" : downFilled ? "thumbs-down" : "",
          };
          setFeedBackModalVisible(true);
          setModalData(data);
        }}
      >
        {t("correct_answer")}
      </Button> */}
    </SpaceBetween>
  );
};

const TextItem = (props) => {
  const { sx, ...other } = props;
  // console.log(other);
  return (
    <Box
      sx={{
        pr: 1,
        pl: 1,
        m: 1,
        whiteSpace: "normal",
        bgcolor: "#f2f8fd",
        color: grey[800],
        border: "2px solid",
        borderColor: "#0972d3",
        borderRadius: 2,
        fontSize: "14px",
        // maxWidth:"max-content",
        minWidth: "40px",
        width: "auto",
        fontWeight: "400",
        ...sx,
      }}
      {...other}
    />
  );
};

const MemoizedMsgItem = memo(MsgItem);

const ChatBox = ({ msgItems, loading }) => {
  const [loadingtext, setLoaderTxt] = useState("Loading.");
  const intervalRef = useRef(0);
  function handleStartTick() {
    
    let textContent = "";
    const intervalId = setInterval(() => {
      setLoaderTxt((v) => v + ".");
      textContent += ".";
      if (textContent.length > 6) {
        setLoaderTxt('Loading.');
        textContent = "";
      }
    }, 500);
    intervalRef.current = intervalId;
  }

  function handleStopClick() {
    const intervalId = intervalRef.current;
    if (intervalId) clearInterval(intervalId);
  }

  useEffect(() =>{
    return ()=>{
      handleStopClick();
    }
  },[])

  useEffect(() => {
    if (loading) {
      setLoaderTxt("Loading.");
      handleStartTick();
    } else {
      setLoaderTxt("");
      handleStopClick();
    }
  }, [loading]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behaviour: "smooth" });
    }
  }, [msgItems.length]);
  const items = msgItems.map((msg) => (
    <MemoizedMsgItem
      // key={generateUniqueId()}
      key={msg.id}
      who={msg.who}
      text={msg.text}
      images={msg.images}
      images_base64 = {msg.images_base64}
      msgid={msg.id}
      connectionId={msg.connectionId}
    />
  ));

  return (
    <Box sx={{ minWidth: 300, minHeight: 400 }}>
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
    </Box>
  );
};

const ConversationsPanel = ({id}) => {
  const { t } = useTranslation();
  const didUnmount = useRef(false);
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
    feedBackModalVisible,
    setFeedBackModalVisible,
    setStopFlag,
    modelParams,
    setNewChatLoading,
  } = useChatData();
  // const [streamMsg, setStreamMsg] = useState("");
  const streamOutput = useRef("");
  const authtoken = useAuthToken();
  const userinfo = useAuthUserInfo();
  const [localStoredMsgItems, setLocalStoredMsgItems] = useLocalStorage(
    params_local_storage_key + userinfo.username+ "-msgitems-" + id,
    []
  );
  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  const onMessageCallback = ({ data }) => {
    setLoading(false);
    setNewChatLoading(false);
    //save conversations
    const resp = JSON.parse(data);

    let chunck = resp.text.content;
    if (chunck.startsWith("\n\n历史对话已清空") || chunck.startsWith("历史对话已清空")) {
      return;
    }
    // console.log("chunck-----------:", chunck);
    // console.log(hideRefDoc);
    // 如果是none stream输出，则全部替换
    if (hideRefDoc || !modelParams?.use_qa) {
      const fullRefRegex = /```json\n#Reference([\w+#-]+)?\n([\s\S]*?)\n```/gm;
      chunck = chunck.replace(fullRefRegex, "");
    }

    // 如果是stream输出，则忽略这个内容
    const refRegex = /```json\n#Reference/gm;
    if ((hideRefDoc || !modelParams?.use_qa) && refRegex.exec(chunck)) {
      return;
    }
    if (resp.role) {
      // if stream stop, save the whole message
      if (chunck === "[DONE]") {
        setStopFlag(false);
        if (streamOutput.current !== "") {
          setConversations((prev) => [
            ...prev,
            {
              role: resp.role,
              content: streamOutput.current,
              connectionId: resp.connectionId,
            },
          ]);

          setLocalStoredMsgItems([
            ...msgItems.slice(0, -1),
            {
              id: resp.msgid,
              who: BOTNAME,
              text: streamOutput.current,
              connectionId: resp.connectionId,
            },
          ]);
          //如果是SD模型返回的url，则保存起来
          const [imgPaths, newtext] = extractImagTag(streamOutput.current);
          imgPaths.map((url) => setImg2txtUrl(url));

          if (conversations.length > MAX_CONVERSATIONS) {
            setConversations(
              (prev) =>
                prev
                  .slice(0, 1)
                  .concat(prev.slice(conversations.length - MAX_CONVERSATIONS)) //prev.slice(0,1)是默认的第一条AI预设角色
            );
          }
        }
      } else {
        streamOutput.current = streamOutput.current + chunck;
        //是用stream时，需要找出相同的msg item，原有content里追加chunck
        const targetItem = msgItems.filter((item) => item.id === resp.msgid);

        // console.log('streamMsg----:',streamOutput.current);
        if (!targetItem.length) {
          //创建一个新的item
          streamOutput.current = chunck;
          setMsgItems((prev) => [
            ...prev,
            {
              id: resp.msgid,
              who: BOTNAME,
              text: streamOutput.current,
              connectionId: resp.connectionId,
            },
          ]);
        } else {
          setMsgItems((prev) => [
            ...prev.slice(0, -1),
            {
              id: resp.msgid,
              who: BOTNAME,
              text: streamOutput.current,
              connectionId: resp.connectionId,
            },
          ]);
        }
      }
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
        return didUnmount.current === false;
      },
      reconnectAttempts: 1000,
      reconnectInterval: (attemptNumber) =>
        Math.min(Math.pow(2, attemptNumber) * 1000, 6000),
    });

  return (
    <SpaceBetween size="l">
      <AddFeedbackModal
        visible={feedBackModalVisible}
        setVisible={setFeedBackModalVisible}
      />
      <Container header={<Header variant="h2">{t("conversations")}</Header>}>
        <ChatBox msgItems={msgItems} loading={loading} />
      </Container>

      <PromptPanel sendMessage={sendJsonMessage} id={id} />
    </SpaceBetween>
  );
};

export default ConversationsPanel;
