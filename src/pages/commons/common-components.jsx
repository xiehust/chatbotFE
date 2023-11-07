// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { forwardRef,useContext,createContext,useState } from 'react';
import toplogo from '../../resources/AWS logo.svg';
import sidebarlogo from '../../resources/Res_Amazon-SageMaker_Model_48_Light.svg';
import langString from '../../common/language_string';
import {
  AppLayout,
  Box,
  Button,
  Flashbar,
  Header,
  TopNavigation,      
  Link,
  SideNavigation,
  SpaceBetween,
  HelpPanel,
  Icon,
  Badge,
} from '@cloudscape-design/components';
import { appLayoutLabels, externalLinkProps } from '../../common/labels';
import { getHeaderCounterText, getServerHeaderCounterText } from '../../common/tableCounterStrings';
import { useNotifications } from './use-notifications';
import {useAuthUserInfo} from './use-auth';
import { useTranslation, Trans } from 'react-i18next';
import i18n from '../../common/i18n';

const settingCtx = createContext();

export const useSettingCtx = ()=>{
  return useContext(settingCtx);
}

export const navHeader = { text: 'AWS Chat Portal', href: '#/', logo: { alt: "logo", src: sidebarlogo} };


const navItems_admin = [
  {
    type: 'section',
    text: i18n.t('chatspace'),
    items: [
      { type: 'link', text: i18n.t('chatbot'), href: '/chat' },
    ],
  }, 
  {
    type: 'section',
    text: i18n.t('admin'),
    items: [
      { type: 'link', text: i18n.t('docs'), href: '/docs' },
      { type: 'link', text: i18n.t('prompt_template'), href: '/template' },
      { type: 'link', text: i18n.t('feedback_management'), href: '/feedback' },
      { type: 'link', text: i18n.t('examples_management'), href: '/examples' },
      { type: 'link', text: i18n.t('user'), href: '/admin/user' },
    ],
  },
];

const navItems = [
  {
    type: 'section',
    text: i18n.t('chatspace'),
    items: [
      { type: 'link', text: i18n.t('chatbot'), href: '/chat' },
    ],
  }, 
  {
    type: 'section',
    text: i18n.t('admin'),
    items: [
      { type: 'link', text: i18n.t('docs'), href: '/docs' },
      { type: 'link', text: i18n.t('prompt_template'), href: '/template' },
      { type: 'link', text: i18n.t('feedback_management'), href: '/feedback' },
      { type: 'link', text: i18n.t('examples_management'), href: '/examples' },

    ],
  },
];




export const topNavString = {
  searchIconAriaLabel: "Search",
      searchDismissIconAriaLabel: "Close search",
      overflowMenuTriggerText: "More",
      overflowMenuTitleText: "All",
      overflowMenuBackIconAriaLabel: "Back",
      overflowMenuDismissIconAriaLabel: "Close menu"
}


export const InfoLink = ({ id, onFollow, ariaLabel }) => (
  <Link variant="info" id={id} onFollow={onFollow} ariaLabel={ariaLabel}>
    Info
  </Link>
);

// a special case of external link, to be used within a link group, where all of them are external
// and we do not repeat the icon
export const ExternalLinkItem = ({ href, text }) => (
  <Link href={href} ariaLabel={`${text} ${externalLinkProps.externalIconAriaLabel}`} target="_blank">
    {text}
  </Link>
);

export const TableNoMatchState = props => {
  const [t] = useTranslation();
  return <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
    <SpaceBetween size="xxs">
      <div>
        <b>{i18n.t('nomatch')}</b>
        <Box variant="p" color="inherit">
        {t('nomatch')}
        </Box>
      </div>
      <Button onClick={props.onClearFilter}>{t('clear_filter')}</Button>
    </SpaceBetween>
  </Box>
}

export const TableEmptyState = ({ resourceName }) => (
  <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
    <SpaceBetween size="xxs">
      <div>
        <b>No {resourceName.toLowerCase()}</b>
        <Box variant="p" color="inherit">
          No {resourceName.toLowerCase()} associated with this resource.
        </Box>
      </div>
      {/* <Button>Create {resourceName.toLowerCase()}</Button> */}
    </SpaceBetween>
  </Box>
);

function getCounter(props) {
  if (props.counter) {
    return props.counter;
  }
  if (!props.totalItems) {
    return null;
  }
  if (props.serverSide) {
    return getServerHeaderCounterText(props.totalItems, props.selectedItems);
  }
  return getHeaderCounterText(props.totalItems, props.selectedItems);
}

export const TableHeader = props => {
 
  return (
    <Header
      variant={props.variant}
      counter={getCounter(props)}
      description={props.description}
      actions={props.actionButtons}
    >
      {props.title}
    </Header>
  );
};


function TopNavHeader (){
  const userInfo = useAuthUserInfo();
  const {t,i18n} = useTranslation();
  const { setModelSettingVisible } = useSettingCtx();
  
  const topNavIdentity ={
  
    href: "/home",
    title:t('awschatportal'),
    logo: {
      src:toplogo,
      alt: "benchmark "
    }
  }
  const topNavUtilities = [
    {
      type: "menu-dropdown",
      iconName: "settings",
      ariaLabel: "Settings",
      title: i18n.t('lang_settings'),
      onItemClick:({detail})=>{
        i18n.changeLanguage(detail.id);
        window.location.reload();
      },
      items: [
        {
          id: "en",
          text: "English"
        },
        {
          id: "zh",
          text: "简体中文"
        }
      ]
    },
    {
      type: "menu-dropdown",
      iconName: "user-profile",
      text:userInfo.username+"@"+userInfo.groupname,
      description: `${t('group')}:${userInfo.groupname}`,
      title: t('Settings'),
      onItemClick:({detail})=>{
        if (detail.id === 'settings'){
          setModelSettingVisible(true);
        }
      },
      items: [
        {
          id: "settings",
          text: t('settings'),
          href: "#"
        },
        { id: "signout", text: t('signout'),href: "/signout"}
      ]
    },
  ]
  return (
    <TopNavigation
    identity={topNavIdentity}
    utilities={topNavUtilities}
    i18nStrings={topNavString}
    />
  )

}
export function Navigation({
  activeHref,
  header = navHeader,
}) {
  const userInfo = useAuthUserInfo();
  const [_activeHref, setActiveHref] = React.useState(activeHref);


  const navitems = userInfo.groupname === 'admin' ? navItems_admin: navItems;

 
  return (
    <SideNavigation
      items={navitems}
      header={header}
      activeHref={_activeHref}
      onFollow={event => {
        if (!event.detail.external) {
       // event.preventDefault();
          setActiveHref(event.detail.href);
   
        }
      }}
    />
  );
}

export function Notifications({ successNotification }) {
  const notifications = useNotifications(successNotification);
  return <Flashbar items={notifications} stackItems={true} />;
}

export const CustomAppLayout = forwardRef((props, ref) => {
  const [modelSettingVisible, setModelSettingVisible] = useState(false);
  return (
    <settingCtx.Provider value = {{modelSettingVisible,setModelSettingVisible}}>
    <div id="h" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
      <TopNavHeader/>
    </div>
    <AppLayout
      ref={ref}
      {...props}
      headerSelector="#header"
      ariaLabels={appLayoutLabels}
      onNavigationChange={event => {
        if (props.onNavigationChange) {
          props.onNavigationChange(event);
        }
      }}
      onToolsChange={event => {
        if (props.onToolsChange) {
          props.onToolsChange(event);
        }
      }}
    />
    </settingCtx.Provider>
  );
})




const toolsFooter = (
  <>
    <h3>
      Learn more{' '}
      <span role="img" aria-label="Icon external Link">
        <Icon name="external" />
      </span>
    </h3>
    <ul>
      <li>
        <ExternalLinkItem
          href="#"
          text="benchportal"
        />
      </li>
    </ul>
  </>
);
export const ToolsContent = () => (
  <HelpPanel footer={toolsFooter} header={<h2>AWS Chatbot</h2>}>
    <p>
      To be added
    </p>
  </HelpPanel>
);