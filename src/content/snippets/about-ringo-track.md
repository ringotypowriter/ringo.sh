---
title: "About Ringo Track"
date: 2025-12-07T17:59:00+08:00
description: "「我也想成为Github 绿砖大师」"
---

项目地址：  
https://github.com/ringotypowriter/ringotrack

---  

> 为什么选 Flutter？  

因为感觉比较有概率写落地。  
之前在跟友人聊天的同时，思考如何着手的时候，还考虑做 Zig 写 Backend（操作 Native）+Electron/其他 Web 技术栈前端选项
但是因为比较在乎友人的感受，以及提高项目落地的概率（真的假的），所以选 Flutter 熟悉写得快

---  

> Flutter 多平台选择  

Flutter 的 Desktop 支持 Windows/MacOS/Linux，但是可以看到我的成品就只有 Windows 和 MacOS 两个适配。因为————很显然没有哪个画画的会去用桌面 Linux。  

就算用 Flutter，本质感觉跟用 Electron 什么的差不多，只不过从前端 Web 技术栈的那些 TS HTML 转到了 Dart，还是用一个相对严谨一点的语言来搓页面。因为核心的一些 Feature 还是需要靠 FFI调用 Native 实现，这也算是一种本地层面的后端了。  

FFI 作为一个罩子把 Native 侧那乱七八糟的调用遮住包成一个黑盒，写下来的感觉整个项目

---  

> AFK检测？

毕竟朋友说着有的时候会打开画布发呆几分钟不知道怎么下笔，而我也了解到另一个画师朋友本身在 Photoshop 内有一些插件是内置记录某一工程的绘画时间的，而那个插件会自动剔除掉没动笔的时间，于是觉得 AFK 检测还是一个蛮重要的 Feature。

---  
> Fuck Microsoft

在做毛玻璃效果的时候，第一版原理是给窗口默认开启毛玻璃，如果用户需要看到，那就把 Flutter 渲染层的 Scaffold 背景色去掉，显示出底部的毛玻璃窗口效果（就像掀开桌布一样），这个手段在 MacOS 上效果很好，没有导致什么问题；到了我的 Windows 11 上效果也不错，虽然是用了一个非官方的 win32 API（「非官方」是一个伏笔）。接着当我信心满满的发给友人，他后来运行了一下过来跟我说，怎么拖动窗口这么卡。

---

> Roadmap

后续考虑做多语言本地化，数据导出迁移，夜间模式（估计是一个主题色）
