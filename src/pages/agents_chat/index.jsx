import React, { useEffect, useRef, useState } from 'react';
import {
    CustomAppLayout,
    Navigation,
  } from '../commons/common-components';
import { useParams } from "react-router-dom";

import {BreadcrumbsDynmic } from './chat-components/common-components';
import Content from './chat-components/content';

export default function AgentsChat(){
    const appLayout = useRef();
    const { agentId } = useParams();

    return (
        <CustomAppLayout
        ref={appLayout}
        navigation={<Navigation activeHref={'/agents'} />}
        breadcrumbs={<BreadcrumbsDynmic id={agentId}/>}
        content={<Content id={agentId}/>}
        stickyNotifications
      />
    )
}