import React, { createContext, useContext, useEffect, useState } from "react";
import {
  SpaceBetween,
} from "@cloudscape-design/components";
import { AddPanel,BaseFormContent } from "./common-components";

const addAgentFormCtx = createContext();

export default function FormContent() {
  const [inValid, setInvalid] = useState(false);
  const [formData, setFormData] = useState({
  });
  return (
    <addAgentFormCtx.Provider value={{ formData, setFormData, inValid, setInvalid }}>
      <BaseFormContent
      formCtx={addAgentFormCtx}
        content={
          <SpaceBetween size="l">
            <AddPanel formCtx={addAgentFormCtx}/>
          </SpaceBetween>
        }
      />
    </addAgentFormCtx.Provider>
  );
}
