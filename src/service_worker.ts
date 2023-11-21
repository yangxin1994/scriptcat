import IoC from "./app/ioc";
import LoggerCore from "./app/logger/core";
import DBWriter from "./app/logger/db_writer";
import { ListenerMessage } from "./app/logger/message_writer";
import MessageCenter from "./app/message/center";
import { MessageHander, MessageBroadcast } from "./app/message/message";
import migrate from "./app/migrate";
import { LoggerDAO } from "./app/repo/logger";
import ResourceManager from "./app/service/resource/manager";
import ScriptManager from "./app/service/script/manager";
import SubscribeManager from "./app/service/subscribe/manager";
import SynchronizeManager from "./app/service/synchronize/manager";
import SystemManager from "./app/service/system/manager";
import ValueManager from "./app/service/value/manager";
import { SystemConfig } from "./pkg/config/config";
import Runtime from "./runtime/background/runtime";

// 数据库初始化
migrate();

chrome.offscreen.createDocument({
  url: "src/offscreen.html",
  reasons: [chrome.offscreen.Reason.CLIPBOARD],
  justification: "offscreen",
});

// 初始化日志组件
const loggerCore = new LoggerCore({
  debug: process.env.NODE_ENV === "development",
  writer: new DBWriter(new LoggerDAO()),
  labels: { env: "service_worker" },
});

loggerCore.logger().debug("background start");
// 通讯中心
const center = new MessageCenter();
center.start();

IoC.registerInstance(MessageCenter, center).alias([
  MessageHander,
  MessageBroadcast,
]);

// 监听logger messagewriter
ListenerMessage(new LoggerDAO(), center);

// 系统配置初始化
(IoC.instance(SystemConfig) as SystemConfig).init();
// 系统管理器初始化
(IoC.instance(SystemManager) as SystemManager).init();
// 资源管理器
(IoC.instance(ResourceManager) as ResourceManager).start();
// value管理器
(IoC.instance(ValueManager) as ValueManager).start();
// 脚本后台处理器
(IoC.instance(Runtime) as Runtime).start();
// 脚本管理器
(IoC.instance(ScriptManager) as ScriptManager).start();
// 订阅管理器
(IoC.instance(SubscribeManager) as SubscribeManager).start();
// 脚本同步处理器
(IoC.instance(SynchronizeManager) as SynchronizeManager).start();
