(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/tradingViewChart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const TradingViewChart = ({ ticket })=>{
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const scriptRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TradingViewChart.useEffect": ()=>{
            if (!containerRef.current || !ticket) return;
            if (!scriptRef.current) {
                const script = document.createElement("script");
                script.src = "https://s3.tradingview.com/tv.js";
                script.async = true;
                script.onload = ({
                    "TradingViewChart.useEffect": ()=>{
                        if (window.TradingView && ticket) {
                            new window.TradingView.widget({
                                container_id: "tradingview_chart",
                                autosize: true,
                                symbol: ticket,
                                interval: "1D",
                                timezone: "Etc/UTC",
                                theme: "dark",
                                style: "1",
                                locale: "ru",
                                enable_publishing: false,
                                hide_top_toolbar: false,
                                hide_side_toolbar: false,
                                allow_symbol_change: false,
                                studies: [
                                    "STD;RSI"
                                ]
                            });
                        }
                    }
                })["TradingViewChart.useEffect"];
                scriptRef.current = script;
                containerRef.current.appendChild(script);
            }
            return ({
                "TradingViewChart.useEffect": ()=>{
                    if (scriptRef.current && containerRef.current) {
                        if (containerRef.current.contains(scriptRef.current)) {
                            containerRef.current.removeChild(scriptRef.current);
                        }
                        scriptRef.current = null;
                    }
                }
            })["TradingViewChart.useEffect"];
        }
    }["TradingViewChart.useEffect"], [
        ticket
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        id: "tradingview_chart",
        ref: containerRef,
        style: {
            width: "100%",
            height: "100%",
            border: "none"
        }
    }, void 0, false, {
        fileName: "[project]/components/tradingViewChart.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(TradingViewChart, "HMLr62BNrD4zo5l5PafbxJojYzM=");
_c = TradingViewChart;
const __TURBOPACK__default__export__ = TradingViewChart;
var _c;
__turbopack_context__.k.register(_c, "TradingViewChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/useBinancePrice.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useBinancePrice",
    ()=>useBinancePrice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$laravel$2d$echo$2f$dist$2f$echo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/laravel-echo/dist/echo.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pusher$2d$js$2f$dist$2f$web$2f$pusher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/pusher-js/dist/web/pusher.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
let echo = null;
function getEcho() {
    if (!echo) {
        window.Pusher = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pusher$2d$js$2f$dist$2f$web$2f$pusher$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"];
        echo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$laravel$2d$echo$2f$dist$2f$echo$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]({
            broadcaster: "reverb",
            key: ("TURBOPACK compile-time value", "local-key"),
            wsHost: ("TURBOPACK compile-time value", "localhost") ?? "localhost",
            wsPort: Number(("TURBOPACK compile-time value", "8080") ?? 8080),
            wssPort: Number(("TURBOPACK compile-time value", "8080") ?? 8080),
            forceTLS: (("TURBOPACK compile-time value", "http") ?? "http") === "https",
            enabledTransports: [
                "ws",
                "wss"
            ]
        });
    }
    return echo;
}
function useBinancePrice(symbol = "BTCUSDT") {
    _s();
    const [price, setPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [timestamp, setTimestamp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [connected, setConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBinancePrice.useEffect": ()=>{
            const echoInstance = getEcho();
            echoInstance.connector.pusher.connection.bind("connected", {
                "useBinancePrice.useEffect": ()=>setConnected(true)
            }["useBinancePrice.useEffect"]);
            echoInstance.connector.pusher.connection.bind("disconnected", {
                "useBinancePrice.useEffect": ()=>setConnected(false)
            }["useBinancePrice.useEffect"]);
            const channel = echoInstance.channel("binance.prices").listen(".price.updated", {
                "useBinancePrice.useEffect.channel": (data)=>{
                    if (data.symbol === symbol) {
                        setPrice(data.price);
                        setTimestamp(data.timestamp);
                    }
                }
            }["useBinancePrice.useEffect.channel"]);
            return ({
                "useBinancePrice.useEffect": ()=>{
                    channel.stopListening(".price.updated");
                }
            })["useBinancePrice.useEffect"];
        }
    }["useBinancePrice.useEffect"], [
        symbol
    ]);
    return {
        price,
        timestamp,
        connected
    };
}
_s(useBinancePrice, "cXXYGM/68NHURylS7jwO7RegeNI=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/BtcPrice.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BtcPrice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useBinancePrice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useBinancePrice.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function BtcPrice() {
    _s();
    const { price, connected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useBinancePrice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBinancePrice"])("BTCUSDT");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-zinc-500"}`
            }, void 0, false, {
                fileName: "[project]/components/BtcPrice.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-zinc-400",
                children: "BTCUSDT"
            }, void 0, false, {
                fileName: "[project]/components/BtcPrice.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-white",
                children: price !== null ? `$${price.toLocaleString("en-US", {
                    minimumFractionDigits: 2
                })}` : "—"
            }, void 0, false, {
                fileName: "[project]/components/BtcPrice.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/BtcPrice.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
_s(BtcPrice, "TSIEvC2WPIAnTrk4gPVj1nU2fSA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useBinancePrice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBinancePrice"]
    ];
});
_c = BtcPrice;
var _c;
__turbopack_context__.k.register(_c, "BtcPrice");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0460keg._.js.map