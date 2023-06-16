// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";
import {
  BreadcrumbGroup,
  SpaceBetween,
  Button,
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";




export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/",
    },
    {
      text: t("docs"),
    },
  ];
  return (
    <BreadcrumbGroup
      items={breadcrumbs}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};

export const BreadcrumbsDynmic = ({ id }) => {
  const { t } = useTranslation();
  return (
    <BreadcrumbGroup
      items={[
        {
          text: t("benchmarkportal"),
          href: "/home",
        },
        {
          text: t("docs"),
          href: "/docs",
        },
        {
          text: id,
          href: "/docs/" + id,
        },
      ]}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};

export const FullPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const isOnlyOneSelected = props.selectedItems.length === 1;
  //  console.log(props.selectedItems);
  const selectId = isOnlyOneSelected ? props.selectedItems[0].job_id : "";
  return (
    <TableHeader
      variant="awsui-h1-sticky"
      title={resourceName}
      actionButtons={
        <SpaceBetween size="xs" direction="horizontal">
          <Button
            name="refresh"
            onClick={props.refreshAction}
            iconName="refresh"
          />
          <Button
            disabled={!isOnlyOneSelected}
            name="view"
            href={"/docs/" + selectId}
          >
            {t('view')}
          </Button>
          <Button
            // onClick={props.createAction}
            href={'/docs/create'}
            variant="primary"
          >{t('create')}</Button>
        </SpaceBetween>
      }
      {...props}
    />
  );
};
