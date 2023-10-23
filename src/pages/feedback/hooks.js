// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState, useRef } from 'react';
import {listFeedback} from '../commons/api-gateway';
import {useAuthUserInfo, useAuthorizedHeader} from "../commons/use-auth";
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';




export function useDistributions(params = {}) {
  const { pageSize, currentPageIndex: clientPageIndex } = params.pagination || {};
  const { filteringText,filteringTokens,filteringOperation} = params.filtering || {};
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(clientPageIndex);
  // const [pageIndexKey, setPageIndexKey] = useState(null);
  const [pageIndexKeyStore, setPageIndexKeyStore] = useState([]);
  const [pagesCount, setPagesCount] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const headers = useAuthorizedHeader();
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;
  const queryParams = {
    main_fun_arn:main_fun_arn,
    apigateway_endpoint:apigateway_endpoint
  }
  const refreshAction =()=>{
      setLoading(true);
      setRefresh(v => !v);
      setCurrentPageIndex(1);
      setPageIndexKeyStore([]);
  }

  useEffect(() => {
    setCurrentPageIndex(clientPageIndex);
  }, [clientPageIndex]);

  useEffect(() => {
    setLoading(true);
    const payload = {
      ...queryParams,
      pageindex_key:JSON.stringify(pageIndexKeyStore[currentPageIndex-1]),
      textfilter:filteringText,
      pagesize:pageSize,
      filteringTokens:JSON.stringify(filteringTokens),
      filteringOperation:filteringOperation
    }
    // console.log(JSON.stringify(payload));
    const controller = new AbortController();

    listFeedback(headers,payload).then(data =>{
      setLoading(false);
      // console.log(data.body);
      const itemdata = data.body.items.map(it => {
        const contentArray = JSON.parse(it.content);
        const lastContent = contentArray[contentArray.length -1];
        return  {
        msgid:it.msgid,
        sid:it['session-id'],
        question:lastContent.question,
        answer:lastContent.answer,
        feedback:lastContent.feedback,
        timestamp:lastContent.timestamp,
        action:lastContent.action,
        username:lastContent.username
        }
      });

      setItems(itemdata);
      // setPageIndexKey(data.body.pageindex_key);
      setPageIndexKeyStore(prev => {
                    prev[currentPageIndex] = data.body.pageindex_key;
                    return prev;})
      setPagesCount(Math.ceil(data.body.total_cnt/pageSize));
      setTotalCount(data.body.total_cnt);

    }).catch(err=>{
      setLoading(false);
      setItems([]);
      console.error(JSON.stringify(err));
    })
    return () => {
      controller.abort();
    };
  }, [
    refresh,
    pageSize,
    currentPageIndex,
    filteringText,
    filteringTokens,
    filteringOperation,
  ]);

  return {
    items,
    loading,
    totalCount,
    pagesCount,
    currentPageIndex,
    refreshAction,
  };
}

const asyncFetchFilteringOptions = params => {
  console.log(params);

  return new Promise((resolve, reject) => {
    try {
      window.FakeServer.fetchDistributionFilteringOptions(params, ({ filteringOptions, filteringProperties }) => {
        resolve({ filteringOptions, filteringProperties });
      });
    } catch (e) {
      reject(e);
    }
  });
};

export function useDistributionsPropertyFiltering(defaultFilteringProperties) {
  const request = useRef({ filteringText: '' });
  const [filteringOptions, setFilteringOptions] = useState([]);
  const [filteringProperties, setFilteringProperties] = useState(defaultFilteringProperties);
  const [status, setStatus] = useState('pending');
  const fetchData = async (filteringText, filteringProperty) => {
    try {
      const { filteringOptions, filteringProperties } = await asyncFetchFilteringOptions({
        filteringText,
        filteringPropertyKey: filteringProperty ? filteringProperty.propertyKey : undefined,
      });
      if (
        !request.current ||
        request.current.filteringText !== filteringText ||
        request.current.filteringProperty !== filteringProperty
      ) {
        // there is another request in progress, discard the result of this one
        return;
      }
      setFilteringOptions(filteringOptions);
      setFilteringProperties(filteringProperties);
      setStatus('finished');
    } catch (error) {
      setStatus('error');
    }
  };

  const handleLoadItems = ({ detail: { filteringProperty, filteringText, firstPage } }) => {
    setStatus('loading');
    if (firstPage) {
      setFilteringOptions([]);
    }
    request.current = {
      filteringProperty,
      filteringText,
    };
    fetchData(filteringText, filteringProperty);
  };

  useEffect(() => {
    fetchData('');
  }, []);

  return {
    status,
    filteringOptions,
    filteringProperties,
    handleLoadItems,
  };
}
