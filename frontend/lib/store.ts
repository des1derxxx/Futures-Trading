import { configureStore } from "@reduxjs/toolkit";
import { tradingApi } from "./apiSlice";
import { notificationsSlice } from "./notificationsSlice";

// Factory function — called once per component tree so each SSR request
// gets its own store and state can't bleed between requests.
export function makeStore() {
  return configureStore({
    reducer: {
      [tradingApi.reducerPath]: tradingApi.reducer,
      [notificationsSlice.name]: notificationsSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(tradingApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
