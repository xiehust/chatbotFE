// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState } from "react";
import TableTemplate from "./table-template";
import {useAuthorizedHeader} from "../../commons/use-auth";
import {remoteGetCall,API_users} from "../../commons/api-gateway"
import { useTranslation } from 'react-i18next';


export default function UserApp(){
    const [tableitems,setTableitems] = useState([]);
    const [loadingState, setLoadingState] = useState(true);
    const headers = useAuthorizedHeader();
    const {t} = useTranslation();

    useEffect(()=>{
        const controller = new AbortController();
        remoteGetCall(headers,API_users,controller)
        .then(data =>{
            setTableitems(data);
            setLoadingState(false);
        })
        .catch(err =>{
            setTableitems([]);
            setLoadingState(false);
            console.log(JSON.stringify(err))
        }

        )
        return () => {
            controller.abort();
          };
    },[]);
    return <TableTemplate distributions ={tableitems}
                resourceName={t('user')}
                buttonName = {t('add')}
                activeHref="/admin/user"
                buttonHref="/admin/adduser"
                loadingState={loadingState}
            />;
}