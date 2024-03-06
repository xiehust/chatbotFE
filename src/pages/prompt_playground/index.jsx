import React, { useEffect, useRef, useState } from 'react';
import {
    CustomAppLayout,
    Navigation,
  } from '../commons/common-components';
import { useParams } from "react-router-dom";

import {BreadcrumbsDynmic } from './chat-components/common-components';
import Content from './chat-components/content';

export default function PromptChat(){
    const appLayout = useRef();
    const { id } = useParams();

    return (
        <CustomAppLayout
        ref={appLayout}
        navigation={<Navigation activeHref={'/prompt_hub'} />}
        breadcrumbs={<BreadcrumbsDynmic id={id}/>}
        content={<Content id={id}/>}
        stickyNotifications
      />
    )
}