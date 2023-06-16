import {configureStore} from "@reduxjs/toolkit";
import itemReducer from "../approvallist/item-slice";

export const store =  configureStore ({
    reducer:{
        fetchItemreducer: itemReducer,
    },
})