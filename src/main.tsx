/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFoundPage from "@/pages/error/NotFoundPage";
import ServerErrorPage from "@/pages/error/ServerErrorPage";
import NetworkErrorPage from "@/pages/error/NetworkErrorPage";
import ToastProvider from '@/components/Toast'

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
            <BrowserRouter>
                <ToastProvider>
                    <Routes>
                            <Route path="/" element={<App />} />
                            <Route path="/error/server" element={<ServerErrorPage />} />
                            <Route path="/error/network" element={<NetworkErrorPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </ToastProvider>
            </BrowserRouter>
    </React.StrictMode>
);
