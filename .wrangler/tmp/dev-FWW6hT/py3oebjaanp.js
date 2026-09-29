var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-r3fdTS/functionsWorker-0.6607582097991134.mjs
import { Writable } from "node:stream";
import { EventEmitter } from "node:events";
var __defProp2 = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __esm = /* @__PURE__ */ __name((fn, res, err) => /* @__PURE__ */ __name(function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
}, "__init"), "__esm");
var __export = /* @__PURE__ */ __name((target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
}, "__export");
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name2(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");
var init_utils = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(createNotImplementedError, "createNotImplementedError");
    __name2(notImplemented, "notImplemented");
    __name2(notImplementedClass, "notImplementedClass");
  }
});
var _timeOrigin;
var _performanceNow;
var nodeTiming;
var PerformanceEntry;
var PerformanceMark;
var PerformanceMeasure;
var PerformanceResourceTiming;
var PerformanceObserverEntryList;
var Performance;
var PerformanceObserver;
var performance;
var init_performance = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      static {
        __name2(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark2");
      }
      static {
        __name2(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      static {
        __name2(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      static {
        __name2(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      static {
        __name2(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      static {
        __name2(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      static {
        __name2(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});
var init_perf_hooks = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});
var init_performance2 = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    if (!("__unenv__" in performance)) {
      const proto = Performance.prototype;
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key !== "constructor" && !(key in performance)) {
          const desc = Object.getOwnPropertyDescriptor(proto, key);
          if (desc) {
            Object.defineProperty(performance, key, desc);
          }
        }
      }
    }
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});
var noop_default;
var init_noop = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});
var _console;
var _ignoreErrors;
var _stderr;
var _stdout;
var log;
var info;
var trace;
var debug;
var table;
var error;
var warn;
var createTask;
var clear;
var count;
var countReset;
var dir;
var dirxml;
var group;
var groupEnd;
var groupCollapsed;
var profile;
var profileEnd;
var time;
var timeEnd;
var timeLog;
var timeStamp;
var Console;
var _times;
var _stdoutErrorHandler;
var _stderrErrorHandler;
var init_console = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});
var workerdConsole;
var assert;
var clear2;
var context;
var count2;
var countReset2;
var createTask2;
var debug2;
var dir2;
var dirxml2;
var error2;
var group2;
var groupCollapsed2;
var groupEnd2;
var info2;
var log2;
var profile2;
var profileEnd2;
var table2;
var time2;
var timeEnd2;
var timeLog2;
var timeStamp2;
var trace2;
var warn2;
var console_default;
var init_console2 = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});
var hrtime;
var init_hrtime = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime2"), "hrtime"), { bigint: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint"), "bigint") });
  }
});
var ReadStream;
var init_read_stream = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      static {
        __name2(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});
var WriteStream;
var init_write_stream = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      static {
        __name2(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});
var init_tty = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});
var NODE_VERSION;
var init_node_version = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});
var Process;
var init_process = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "_Process");
      }
      static {
        __name2(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw /* @__PURE__ */ createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw /* @__PURE__ */ createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw /* @__PURE__ */ createNotImplementedError("process.kill");
      }
      abort() {
        throw /* @__PURE__ */ createNotImplementedError("process.abort");
      }
      dlopen() {
        throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
      }
      assert() {
        throw /* @__PURE__ */ createNotImplementedError("process.assert");
      }
      binding() {
        throw /* @__PURE__ */ createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name2(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});
var globalProcess;
var getBuiltinModule;
var workerdProcess;
var unenvProcess;
var exit;
var features;
var platform;
var _channel;
var _debugEnd;
var _debugProcess;
var _disconnect;
var _events;
var _eventsCount;
var _exiting;
var _fatalException;
var _getActiveHandles;
var _getActiveRequests;
var _handleQueue;
var _kill;
var _linkedBinding;
var _maxListeners;
var _pendingMessage;
var _preload_modules;
var _rawDebug;
var _send;
var _startProfilerIdleNotifier;
var _stopProfilerIdleNotifier;
var _tickCallback;
var abort;
var addListener;
var allowedNodeEnvironmentFlags;
var arch;
var argv;
var argv0;
var assert2;
var availableMemory;
var binding;
var channel;
var chdir;
var config;
var connected;
var constrainedMemory;
var cpuUsage;
var cwd;
var debugPort;
var disconnect;
var dlopen;
var domain;
var emit;
var emitWarning;
var env;
var eventNames;
var execArgv;
var execPath;
var exitCode;
var finalization;
var getActiveResourcesInfo;
var getegid;
var geteuid;
var getgid;
var getgroups;
var getMaxListeners;
var getuid;
var hasUncaughtExceptionCaptureCallback;
var hrtime3;
var initgroups;
var kill;
var listenerCount;
var listeners;
var loadEnvFile;
var mainModule;
var memoryUsage;
var moduleLoadList;
var nextTick;
var off;
var on;
var once;
var openStdin;
var permission;
var pid;
var ppid;
var prependListener;
var prependOnceListener;
var rawListeners;
var reallyExit;
var ref;
var release;
var removeAllListeners;
var removeListener;
var report;
var resourceUsage;
var send;
var setegid;
var seteuid;
var setgid;
var setgroups;
var setMaxListeners;
var setSourceMapsEnabled;
var setuid;
var setUncaughtExceptionCaptureCallback;
var sourceMapsEnabled;
var stderr;
var stdin;
var stdout;
var throwDeprecation;
var title;
var traceDeprecation;
var umask;
var unref;
var uptime;
var version;
var versions;
var _process;
var process_default;
var init_process2 = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert2,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});
var config_default;
var init_config = __esm({
  "../netlify/functions/config.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    config_default = /* @__PURE__ */ __name2(async () => new Response(JSON.stringify({ maptilerKey: process.env.MAPTILER_KEY || null }), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "netlify-cdn-cache-control": "public, s-maxage=300" }
    }), "default");
  }
});
function wrap(handler) {
  return async (ctx) => {
    const { request, env: env2 } = ctx;
    globalThis.__OWN_CF = true;
    if (env2.STORE) globalThis.__OWN_KV = env2.STORE;
    if (typeof globalThis.process === "undefined") globalThis.process = { env: {} };
    if (!globalThis.process.env) globalThis.process.env = {};
    for (const [k, v] of Object.entries(env2 || {})) if (typeof v === "string") globalThis.process.env[k] = v;
    const cache2 = request.method === "GET" && typeof caches !== "undefined" ? caches.default : null;
    if (cache2) {
      const hit = await cache2.match(request).catch(() => null);
      if (hit) {
        const out = new Response(hit.body, hit);
        out.headers.set("cache-control", "public, max-age=0, must-revalidate");
        return out;
      }
    }
    const res = await handler(request, ctx);
    const cdn = res.headers.get("netlify-cdn-cache-control") || "";
    const age = +(cdn.match(/s-maxage=(\d+)/)?.[1] || 0);
    if (cache2 && res.status === 200 && age > 0) {
      const copy = res.clone();
      const stored = new Response(copy.body, copy);
      stored.headers.set("cache-control", `public, s-maxage=${age}`);
      ctx.waitUntil(cache2.put(request, stored).catch(() => {
      }));
    }
    return res;
  };
}
__name(wrap, "wrap");
var init_cf = __esm({
  "_cf.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name2(wrap, "wrap");
  }
});
var onRequest;
var init_config2 = __esm({
  "api/config.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_config();
    init_cf();
    onRequest = wrap(config_default);
  }
});
var NF_ERROR;
var NF_REQUEST_ID;
var BlobsInternalError;
var collectIterator;
var base64Decode;
var base64Encode;
var getEnvironment;
var getEnvironmentContext;
var setEnvironmentContext;
var MissingBlobsEnvironmentError;
var BASE64_PREFIX;
var METADATA_HEADER_INTERNAL;
var METADATA_HEADER_EXTERNAL;
var METADATA_MAX_SIZE;
var encodeMetadata;
var decodeMetadata;
var getMetadataFromResponse;
var BlobsConsistencyError;
var REGION_AUTO;
var regions;
var isValidRegion;
var InvalidBlobsRegionError;
var DEFAULT_RETRY_DELAY;
var MIN_RETRY_DELAY;
var MAX_RETRY;
var RATE_LIMIT_HEADER;
var fetchAndRetry;
var getDelay;
var sleep;
var SIGNED_URL_ACCEPT_HEADER;
var Client;
var getClientOptions;
var init_chunk_XR3MUBBK = __esm({
  "../node_modules/@netlify/blobs/dist/chunk-XR3MUBBK.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NF_ERROR = "x-nf-error";
    NF_REQUEST_ID = "x-nf-request-id";
    BlobsInternalError = class extends Error {
      static {
        __name(this, "BlobsInternalError");
      }
      static {
        __name2(this, "BlobsInternalError");
      }
      constructor(res) {
        let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
        if (res.headers.has(NF_REQUEST_ID)) {
          details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
        }
        super(`Netlify Blobs has generated an internal error (${details})`);
        this.name = "BlobsInternalError";
      }
    };
    collectIterator = /* @__PURE__ */ __name2(async (iterator) => {
      const result = [];
      for await (const item of iterator) {
        result.push(item);
      }
      return result;
    }, "collectIterator");
    base64Decode = /* @__PURE__ */ __name2((input) => {
      const { Buffer: Buffer2 } = globalThis;
      if (Buffer2) {
        return Buffer2.from(input, "base64").toString();
      }
      return atob(input);
    }, "base64Decode");
    base64Encode = /* @__PURE__ */ __name2((input) => {
      const { Buffer: Buffer2 } = globalThis;
      if (Buffer2) {
        return Buffer2.from(input).toString("base64");
      }
      return btoa(input);
    }, "base64Encode");
    getEnvironment = /* @__PURE__ */ __name2(() => {
      const { Deno, Netlify, process: process2 } = globalThis;
      return Netlify?.env ?? Deno?.env ?? {
        delete: /* @__PURE__ */ __name2((key) => delete process2?.env[key], "delete"),
        get: /* @__PURE__ */ __name2((key) => process2?.env[key], "get"),
        has: /* @__PURE__ */ __name2((key) => Boolean(process2?.env[key]), "has"),
        set: /* @__PURE__ */ __name2((key, value) => {
          if (process2?.env) {
            process2.env[key] = value;
          }
        }, "set"),
        toObject: /* @__PURE__ */ __name2(() => process2?.env ?? {}, "toObject")
      };
    }, "getEnvironment");
    getEnvironmentContext = /* @__PURE__ */ __name2(() => {
      const context2 = globalThis.netlifyBlobsContext || getEnvironment().get("NETLIFY_BLOBS_CONTEXT");
      if (typeof context2 !== "string" || !context2) {
        return {};
      }
      const data = base64Decode(context2);
      try {
        return JSON.parse(data);
      } catch {
      }
      return {};
    }, "getEnvironmentContext");
    setEnvironmentContext = /* @__PURE__ */ __name2((context2) => {
      const encodedContext = base64Encode(JSON.stringify(context2));
      getEnvironment().set("NETLIFY_BLOBS_CONTEXT", encodedContext);
    }, "setEnvironmentContext");
    MissingBlobsEnvironmentError = class extends Error {
      static {
        __name(this, "MissingBlobsEnvironmentError");
      }
      static {
        __name2(this, "MissingBlobsEnvironmentError");
      }
      constructor(requiredProperties) {
        super(
          `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
            ", "
          )}`
        );
        this.name = "MissingBlobsEnvironmentError";
      }
    };
    BASE64_PREFIX = "b64;";
    METADATA_HEADER_INTERNAL = "x-amz-meta-user";
    METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
    METADATA_MAX_SIZE = 2 * 1024;
    encodeMetadata = /* @__PURE__ */ __name2((metadata) => {
      if (!metadata) {
        return null;
      }
      const encodedObject = base64Encode(JSON.stringify(metadata));
      const payload = `b64;${encodedObject}`;
      if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
        throw new Error("Metadata object exceeds the maximum size");
      }
      return payload;
    }, "encodeMetadata");
    decodeMetadata = /* @__PURE__ */ __name2((header) => {
      if (!header || !header.startsWith(BASE64_PREFIX)) {
        return {};
      }
      const encodedData = header.slice(BASE64_PREFIX.length);
      const decodedData = base64Decode(encodedData);
      const metadata = JSON.parse(decodedData);
      return metadata;
    }, "decodeMetadata");
    getMetadataFromResponse = /* @__PURE__ */ __name2((response) => {
      if (!response.headers) {
        return {};
      }
      const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
      try {
        return decodeMetadata(value);
      } catch {
        throw new Error(
          "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
        );
      }
    }, "getMetadataFromResponse");
    BlobsConsistencyError = class extends Error {
      static {
        __name(this, "BlobsConsistencyError");
      }
      static {
        __name2(this, "BlobsConsistencyError");
      }
      constructor() {
        super(
          `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
        );
        this.name = "BlobsConsistencyError";
      }
    };
    REGION_AUTO = "auto";
    regions = {
      "us-east-1": true,
      "us-east-2": true,
      "eu-central-1": true,
      "ap-southeast-1": true,
      "ap-southeast-2": true
    };
    isValidRegion = /* @__PURE__ */ __name2((input) => Object.keys(regions).includes(input), "isValidRegion");
    InvalidBlobsRegionError = class extends Error {
      static {
        __name(this, "InvalidBlobsRegionError");
      }
      static {
        __name2(this, "InvalidBlobsRegionError");
      }
      constructor(region) {
        super(
          `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
        );
        this.name = "InvalidBlobsRegionError";
      }
    };
    DEFAULT_RETRY_DELAY = getEnvironment().get("NODE_ENV") === "test" ? 1 : 5e3;
    MIN_RETRY_DELAY = 1e3;
    MAX_RETRY = 5;
    RATE_LIMIT_HEADER = "X-RateLimit-Reset";
    fetchAndRetry = /* @__PURE__ */ __name2(async (fetch2, url, options, attemptsLeft = MAX_RETRY) => {
      try {
        const res = await fetch2(url, options);
        if (attemptsLeft > 0 && (res.status === 429 || res.status >= 500)) {
          const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
          await sleep(delay);
          return fetchAndRetry(fetch2, url, options, attemptsLeft - 1);
        }
        return res;
      } catch (error3) {
        if (attemptsLeft === 0) {
          throw error3;
        }
        const delay = getDelay();
        await sleep(delay);
        return fetchAndRetry(fetch2, url, options, attemptsLeft - 1);
      }
    }, "fetchAndRetry");
    getDelay = /* @__PURE__ */ __name2((rateLimitReset) => {
      if (!rateLimitReset) {
        return DEFAULT_RETRY_DELAY;
      }
      return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
    }, "getDelay");
    sleep = /* @__PURE__ */ __name2((ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    }), "sleep");
    SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
    Client = class {
      static {
        __name(this, "Client");
      }
      static {
        __name2(this, "Client");
      }
      constructor({ apiURL, consistency, edgeURL, fetch: fetch2, region, siteID, token, uncachedEdgeURL }) {
        this.apiURL = apiURL;
        this.consistency = consistency ?? "eventual";
        this.edgeURL = edgeURL;
        this.fetch = fetch2 ?? globalThis.fetch;
        this.region = region;
        this.siteID = siteID;
        this.token = token;
        this.uncachedEdgeURL = uncachedEdgeURL;
        if (!this.fetch) {
          throw new Error(
            "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
          );
        }
      }
      async getFinalRequest({
        consistency: opConsistency,
        key,
        metadata,
        method,
        parameters = {},
        storeName
      }) {
        const encodedMetadata = encodeMetadata(metadata);
        const consistency = opConsistency ?? this.consistency;
        let urlPath = `/${this.siteID}`;
        if (storeName) {
          urlPath += `/${storeName}`;
        }
        if (key) {
          urlPath += `/${key}`;
        }
        if (this.edgeURL) {
          if (consistency === "strong" && !this.uncachedEdgeURL) {
            throw new BlobsConsistencyError();
          }
          const headers = {
            authorization: `Bearer ${this.token}`
          };
          if (encodedMetadata) {
            headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
          }
          if (this.region) {
            urlPath = `/region:${this.region}${urlPath}`;
          }
          const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
          for (const key2 in parameters) {
            url2.searchParams.set(key2, parameters[key2]);
          }
          return {
            headers,
            url: url2.toString()
          };
        }
        const apiHeaders = { authorization: `Bearer ${this.token}` };
        const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
        for (const key2 in parameters) {
          url.searchParams.set(key2, parameters[key2]);
        }
        if (this.region) {
          url.searchParams.set("region", this.region);
        }
        if (storeName === void 0 || key === void 0) {
          return {
            headers: apiHeaders,
            url: url.toString()
          };
        }
        if (encodedMetadata) {
          apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
        }
        if (method === "head" || method === "delete") {
          return {
            headers: apiHeaders,
            url: url.toString()
          };
        }
        const res = await this.fetch(url.toString(), {
          headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
          method
        });
        if (res.status !== 200) {
          throw new BlobsInternalError(res);
        }
        const { url: signedURL } = await res.json();
        const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
        return {
          headers: userHeaders,
          url: signedURL
        };
      }
      async makeRequest({
        body,
        consistency,
        headers: extraHeaders,
        key,
        metadata,
        method,
        parameters,
        storeName
      }) {
        const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
          consistency,
          key,
          metadata,
          method,
          parameters,
          storeName
        });
        const headers = {
          ...baseHeaders,
          ...extraHeaders
        };
        if (method === "put") {
          headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
        }
        const options = {
          body,
          headers,
          method
        };
        if (body instanceof ReadableStream) {
          options.duplex = "half";
        }
        return fetchAndRetry(this.fetch, url, options);
      }
    };
    getClientOptions = /* @__PURE__ */ __name2((options, contextOverride) => {
      const context2 = contextOverride ?? getEnvironmentContext();
      const siteID = context2.siteID ?? options.siteID;
      const token = context2.token ?? options.token;
      if (!siteID || !token) {
        throw new MissingBlobsEnvironmentError(["siteID", "token"]);
      }
      if (options.region !== void 0 && !isValidRegion(options.region)) {
        throw new InvalidBlobsRegionError(options.region);
      }
      const clientOptions = {
        apiURL: context2.apiURL ?? options.apiURL,
        consistency: options.consistency,
        edgeURL: context2.edgeURL ?? options.edgeURL,
        fetch: options.fetch,
        region: options.region,
        siteID,
        token,
        uncachedEdgeURL: context2.uncachedEdgeURL ?? options.uncachedEdgeURL
      };
      return clientOptions;
    }, "getClientOptions");
  }
});
var main_exports = {};
__export(main_exports, {
  connectLambda: /* @__PURE__ */ __name(() => connectLambda, "connectLambda"),
  getDeployStore: /* @__PURE__ */ __name(() => getDeployStore, "getDeployStore"),
  getStore: /* @__PURE__ */ __name(() => getStore, "getStore"),
  listStores: /* @__PURE__ */ __name(() => listStores, "listStores"),
  setEnvironmentContext: /* @__PURE__ */ __name(() => setEnvironmentContext, "setEnvironmentContext")
});
function listStores(options = {}) {
  const context2 = getEnvironmentContext();
  const clientOptions = getClientOptions(options, context2);
  const client = new Client(clientOptions);
  const iterator = getListIterator(client, SITE_STORE_PREFIX);
  if (options.paginate) {
    return iterator;
  }
  return collectIterator(iterator).then((results) => ({ stores: results.flatMap((page) => page.stores) }));
}
__name(listStores, "listStores");
var connectLambda;
var DEPLOY_STORE_PREFIX;
var LEGACY_STORE_INTERNAL_PREFIX;
var SITE_STORE_PREFIX;
var Store;
var getDeployStore;
var getStore;
var formatListStoreResponse;
var getListIterator;
var init_main = __esm({
  "../node_modules/@netlify/blobs/dist/main.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_chunk_XR3MUBBK();
    connectLambda = /* @__PURE__ */ __name2((event) => {
      const rawData = base64Decode(event.blobs);
      const data = JSON.parse(rawData);
      const environmentContext = {
        deployID: event.headers["x-nf-deploy-id"],
        edgeURL: data.url,
        siteID: event.headers["x-nf-site-id"],
        token: data.token
      };
      setEnvironmentContext(environmentContext);
    }, "connectLambda");
    DEPLOY_STORE_PREFIX = "deploy:";
    LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
    SITE_STORE_PREFIX = "site:";
    Store = class _Store {
      static {
        __name(this, "_Store");
      }
      static {
        __name2(this, "_Store");
      }
      constructor(options) {
        this.client = options.client;
        if ("deployID" in options) {
          _Store.validateDeployID(options.deployID);
          let name = DEPLOY_STORE_PREFIX + options.deployID;
          if (options.name) {
            name += `:${options.name}`;
          }
          this.name = name;
        } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
          const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
          _Store.validateStoreName(storeName);
          this.name = storeName;
        } else {
          _Store.validateStoreName(options.name);
          this.name = SITE_STORE_PREFIX + options.name;
        }
      }
      async delete(key) {
        const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
        if (![200, 204, 404].includes(res.status)) {
          throw new BlobsInternalError(res);
        }
      }
      async get(key, options) {
        const { consistency, type } = options ?? {};
        const res = await this.client.makeRequest({ consistency, key, method: "get", storeName: this.name });
        if (res.status === 404) {
          return null;
        }
        if (res.status !== 200) {
          throw new BlobsInternalError(res);
        }
        if (type === void 0 || type === "text") {
          return res.text();
        }
        if (type === "arrayBuffer") {
          return res.arrayBuffer();
        }
        if (type === "blob") {
          return res.blob();
        }
        if (type === "json") {
          return res.json();
        }
        if (type === "stream") {
          return res.body;
        }
        throw new BlobsInternalError(res);
      }
      async getMetadata(key, { consistency } = {}) {
        const res = await this.client.makeRequest({ consistency, key, method: "head", storeName: this.name });
        if (res.status === 404) {
          return null;
        }
        if (res.status !== 200 && res.status !== 304) {
          throw new BlobsInternalError(res);
        }
        const etag = res?.headers.get("etag") ?? void 0;
        const metadata = getMetadataFromResponse(res);
        const result = {
          etag,
          metadata
        };
        return result;
      }
      async getWithMetadata(key, options) {
        const { consistency, etag: requestETag, type } = options ?? {};
        const headers = requestETag ? { "if-none-match": requestETag } : void 0;
        const res = await this.client.makeRequest({
          consistency,
          headers,
          key,
          method: "get",
          storeName: this.name
        });
        if (res.status === 404) {
          return null;
        }
        if (res.status !== 200 && res.status !== 304) {
          throw new BlobsInternalError(res);
        }
        const responseETag = res?.headers.get("etag") ?? void 0;
        const metadata = getMetadataFromResponse(res);
        const result = {
          etag: responseETag,
          metadata
        };
        if (res.status === 304 && requestETag) {
          return { data: null, ...result };
        }
        if (type === void 0 || type === "text") {
          return { data: await res.text(), ...result };
        }
        if (type === "arrayBuffer") {
          return { data: await res.arrayBuffer(), ...result };
        }
        if (type === "blob") {
          return { data: await res.blob(), ...result };
        }
        if (type === "json") {
          return { data: await res.json(), ...result };
        }
        if (type === "stream") {
          return { data: res.body, ...result };
        }
        throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
      }
      list(options = {}) {
        const iterator = this.getListIterator(options);
        if (options.paginate) {
          return iterator;
        }
        return collectIterator(iterator).then(
          (items) => items.reduce(
            (acc, item) => ({
              blobs: [...acc.blobs, ...item.blobs],
              directories: [...acc.directories, ...item.directories]
            }),
            { blobs: [], directories: [] }
          )
        );
      }
      async set(key, data, { metadata } = {}) {
        _Store.validateKey(key);
        const res = await this.client.makeRequest({
          body: data,
          key,
          metadata,
          method: "put",
          storeName: this.name
        });
        if (res.status !== 200) {
          throw new BlobsInternalError(res);
        }
      }
      async setJSON(key, data, { metadata } = {}) {
        _Store.validateKey(key);
        const payload = JSON.stringify(data);
        const headers = {
          "content-type": "application/json"
        };
        const res = await this.client.makeRequest({
          body: payload,
          headers,
          key,
          metadata,
          method: "put",
          storeName: this.name
        });
        if (res.status !== 200) {
          throw new BlobsInternalError(res);
        }
      }
      static formatListResultBlob(result) {
        if (!result.key) {
          return null;
        }
        return {
          etag: result.etag,
          key: result.key
        };
      }
      static validateKey(key) {
        if (key === "") {
          throw new Error("Blob key must not be empty.");
        }
        if (key.startsWith("/") || key.startsWith("%2F")) {
          throw new Error("Blob key must not start with forward slash (/).");
        }
        if (new TextEncoder().encode(key).length > 600) {
          throw new Error(
            "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
          );
        }
      }
      static validateDeployID(deployID) {
        if (!/^\w{1,24}$/.test(deployID)) {
          throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
        }
      }
      static validateStoreName(name) {
        if (name.includes("/") || name.includes("%2F")) {
          throw new Error("Store name must not contain forward slashes (/).");
        }
        if (new TextEncoder().encode(name).length > 64) {
          throw new Error(
            "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
          );
        }
      }
      getListIterator(options) {
        const { client, name: storeName } = this;
        const parameters = {};
        if (options?.prefix) {
          parameters.prefix = options.prefix;
        }
        if (options?.directories) {
          parameters.directories = "true";
        }
        return {
          [Symbol.asyncIterator]() {
            let currentCursor = null;
            let done = false;
            return {
              async next() {
                if (done) {
                  return { done: true, value: void 0 };
                }
                const nextParameters = { ...parameters };
                if (currentCursor !== null) {
                  nextParameters.cursor = currentCursor;
                }
                const res = await client.makeRequest({
                  method: "get",
                  parameters: nextParameters,
                  storeName
                });
                let blobs = [];
                let directories = [];
                if (![200, 204, 404].includes(res.status)) {
                  throw new BlobsInternalError(res);
                }
                if (res.status === 404) {
                  done = true;
                } else {
                  const page = await res.json();
                  if (page.next_cursor) {
                    currentCursor = page.next_cursor;
                  } else {
                    done = true;
                  }
                  blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                  directories = page.directories ?? [];
                }
                return {
                  done: false,
                  value: {
                    blobs,
                    directories
                  }
                };
              }
            };
          }
        };
      }
    };
    getDeployStore = /* @__PURE__ */ __name2((input = {}) => {
      const context2 = getEnvironmentContext();
      const options = typeof input === "string" ? { name: input } : input;
      const deployID = options.deployID ?? context2.deployID;
      if (!deployID) {
        throw new MissingBlobsEnvironmentError(["deployID"]);
      }
      const clientOptions = getClientOptions(options, context2);
      if (!clientOptions.region) {
        if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
          if (!context2.primaryRegion) {
            throw new Error(
              "When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the `getDeployStore` options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again."
            );
          }
          clientOptions.region = context2.primaryRegion;
        } else {
          clientOptions.region = REGION_AUTO;
        }
      }
      const client = new Client(clientOptions);
      return new Store({ client, deployID, name: options.name });
    }, "getDeployStore");
    getStore = /* @__PURE__ */ __name2((input) => {
      if (typeof input === "string") {
        const clientOptions = getClientOptions({});
        const client = new Client(clientOptions);
        return new Store({ client, name: input });
      }
      if (typeof input?.name === "string" && typeof input?.siteID === "string" && typeof input?.token === "string") {
        const { name, siteID, token } = input;
        const clientOptions = getClientOptions(input, { siteID, token });
        if (!name || !siteID || !token) {
          throw new MissingBlobsEnvironmentError(["name", "siteID", "token"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, name });
      }
      if (typeof input?.name === "string") {
        const { name } = input;
        const clientOptions = getClientOptions(input);
        if (!name) {
          throw new MissingBlobsEnvironmentError(["name"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, name });
      }
      if (typeof input?.deployID === "string") {
        const clientOptions = getClientOptions(input);
        const { deployID } = input;
        if (!deployID) {
          throw new MissingBlobsEnvironmentError(["deployID"]);
        }
        const client = new Client(clientOptions);
        return new Store({ client, deployID });
      }
      throw new Error(
        "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
      );
    }, "getStore");
    __name2(listStores, "listStores");
    formatListStoreResponse = /* @__PURE__ */ __name2((stores) => stores.filter((store) => !store.startsWith(DEPLOY_STORE_PREFIX)).map((store) => store.startsWith(SITE_STORE_PREFIX) ? store.slice(SITE_STORE_PREFIX.length) : store), "formatListStoreResponse");
    getListIterator = /* @__PURE__ */ __name2((client, prefix) => {
      const parameters = {
        prefix
      };
      return {
        [Symbol.asyncIterator]() {
          let currentCursor = null;
          let done = false;
          return {
            async next() {
              if (done) {
                return { done: true, value: void 0 };
              }
              const nextParameters = { ...parameters };
              if (currentCursor !== null) {
                nextParameters.cursor = currentCursor;
              }
              const res = await client.makeRequest({
                method: "get",
                parameters: nextParameters
              });
              if (res.status === 404) {
                return { done: true, value: void 0 };
              }
              const page = await res.json();
              if (page.next_cursor) {
                currentCursor = page.next_cursor;
              } else {
                done = true;
              }
              return {
                done: false,
                value: {
                  ...page,
                  stores: formatListStoreResponse(page.stores)
                }
              };
            }
          };
        }
      };
    }, "getListIterator");
  }
});
function kvStore(kv, name) {
  const k = /* @__PURE__ */ __name2((key) => `${name}/${key}`, "k");
  return {
    get: /* @__PURE__ */ __name2(async (key, { type } = {}) => type === "json" ? kv.get(k(key), "json") : kv.get(k(key)), "get"),
    set: /* @__PURE__ */ __name2((key, value) => kv.put(k(key), String(value)), "set"),
    setJSON: /* @__PURE__ */ __name2((key, value) => kv.put(k(key), JSON.stringify(value)), "setJSON")
  };
}
__name(kvStore, "kvStore");
function memStore(name) {
  const k = /* @__PURE__ */ __name2((key) => `${name}/${key}`, "k");
  return {
    get: /* @__PURE__ */ __name2(async (key, { type } = {}) => {
      const v = memory.get(k(key));
      return v === void 0 ? null : type === "json" ? JSON.parse(v) : v;
    }, "get"),
    set: /* @__PURE__ */ __name2(async (key, value) => void memory.set(k(key), String(value)), "set"),
    setJSON: /* @__PURE__ */ __name2(async (key, value) => void memory.set(k(key), JSON.stringify(value)), "setJSON")
  };
}
__name(memStore, "memStore");
async function getStore2(name) {
  if (globalThis.__OWN_KV) return kvStore(globalThis.__OWN_KV, name);
  if (globalThis.__OWN_CF) return memStore(name);
  try {
    const { getStore: netlifyStore } = await Promise.resolve().then(() => (init_main(), main_exports));
    return netlifyStore(name);
  } catch {
    return memStore(name);
  }
}
__name(getStore2, "getStore2");
async function sha256(text2) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text2));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
var memory;
var init_store = __esm({
  "../netlify/shared/store.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    memory = /* @__PURE__ */ new Map();
    __name2(kvStore, "kvStore");
    __name2(memStore, "memStore");
    __name2(getStore2, "getStore");
    __name2(sha256, "sha256");
  }
});
var json;
var clip;
var contact_default;
var init_contact = __esm({
  "../netlify/functions/contact.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_store();
    json = /* @__PURE__ */ __name2((body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }), "json");
    clip = /* @__PURE__ */ __name2((v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n), "clip");
    contact_default = /* @__PURE__ */ __name2(async (req) => {
      if (req.method !== "POST") return json({ error: "POST only" }, 405);
      let b = {};
      try {
        const type = req.headers.get("content-type") || "";
        b = type.includes("json") ? await req.json() : Object.fromEntries(new URLSearchParams(await req.text()));
      } catch {
        return json({ error: "bad request" }, 400);
      }
      if (b.company) return json({ ok: true });
      const msg = { name: clip(b.name, 120), email: clip(b.email, 200), topic: clip(b.topic, 60), message: clip(b.message, 5e3), at: (/* @__PURE__ */ new Date()).toISOString() };
      if (!msg.message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(msg.email)) return json({ error: "Please add your email and a message." }, 400);
      try {
        const store = await getStore2("contact");
        await store.setJSON(`${msg.at.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`, msg);
      } catch {
        return json({ error: "The message could not be saved. Please email instead." }, 500);
      }
      return json({ ok: true });
    }, "default");
  }
});
var onRequest2;
var init_contact2 = __esm({
  "api/contact.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_contact();
    init_cf();
    onRequest2 = wrap(contact_default);
  }
});
async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: "jsonv2", addressdetails: "1", countrycodes: "au", limit: "3" })}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en-AU" }, signal: AbortSignal.timeout(8e3) });
    if (r.ok) return r.json();
    if (attempt === 0 && (r.status === 429 || r.status >= 500)) await new Promise((res) => setTimeout(res, 1300));
    else throw new Error(`geocoder ${r.status}`);
  }
  throw new Error("geocoder busy");
}
__name(nominatim, "nominatim");
async function maptiler(q, key) {
  const r = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?${new URLSearchParams({ key, country: "au", limit: "3", language: "en" })}`, { signal: AbortSignal.timeout(8e3) });
  if (!r.ok) throw new Error(`geocoder ${r.status}`);
  const d = await r.json();
  const ctx = /* @__PURE__ */ __name2((f, id) => (f.context || []).find((c) => String(c.id || "").startsWith(id))?.text || null, "ctx");
  return (d.features || []).map((f) => ({
    label: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
    precision: f.address ? "address" : (f.place_type || []).includes("street") ? "street" : "area",
    number: f.address || null,
    street: (f.place_type || []).some((t) => t === "address" || t === "street") ? f.text : null,
    suburb: ctx(f, "place") || ctx(f, "locality") || ctx(f, "municipal_district") || null,
    postcode: ctx(f, "postal_code"),
    state: ctx(f, "region")
  }));
}
__name(maptiler, "maptiler");
async function readQuery(req) {
  if (req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    return String(b.q || "");
  }
  return new URL(req.url).searchParams.get("q") || "";
}
__name(readQuery, "readQuery");
var UA;
var json2;
var geocode_default;
var init_geocode = __esm({
  "../netlify/functions/geocode.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_store();
    UA = "OwnarooAU/1.0 (+https://github.com/LAZARZEC18/keystone-property; property research site)";
    json2 = /* @__PURE__ */ __name2((body, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "netlify-cdn-cache-control": status === 200 ? "public, s-maxage=604800" : "no-store"
      }
    }), "json");
    __name2(nominatim, "nominatim");
    __name2(maptiler, "maptiler");
    __name2(readQuery, "readQuery");
    geocode_default = /* @__PURE__ */ __name2(async (req) => {
      const q = (await readQuery(req)).trim().slice(0, 160);
      if (q.length < 4) return json2({ error: "address too short" }, 400);
      const key = (await sha256(q.toLowerCase())).slice(0, 32);
      let store = null;
      try {
        store = await getStore2("geocode");
        const hit = await store.get(key, { type: "json" });
        if (hit && Date.now() - hit.at < 30 * 864e5) return json2(hit.body);
      } catch {
        store = null;
      }
      const mt = process.env.MAPTILER_KEY;
      try {
        if (mt) {
          const results = await maptiler(q, mt);
          const body2 = { results, attribution: "\xA9 MapTiler \xA9 OpenStreetMap contributors" };
          await store?.setJSON(key, { at: Date.now(), body: body2 }).catch(() => {
          });
          return json2(body2);
        }
        let res = await nominatim(q);
        let fallback = false;
        if (!res.length) {
          res = await nominatim(q.replace(/^\s*(unit\s*)?[\d/\-a-z]+\s*[,/]?\s*/i, ""));
          fallback = true;
        }
        const ROAD = /* @__PURE__ */ new Set(["road", "street", "residential", "tertiary", "secondary", "primary", "unclassified", "living_street", "service", "pedestrian", "trunk"]);
        const out = res.map((x) => ({
          label: x.display_name,
          lat: +x.lat,
          lng: +x.lon,
          // 'address' = house number found; 'street' = the street exists but not that number; 'area' = only a suburb/town matched
          precision: x.address?.house_number && !fallback ? "address" : x.address?.road && (ROAD.has(x.addresstype) || x.addresstype === "road" || x.address?.house_number) ? "street" : "area",
          number: x.address?.house_number || null,
          street: x.address?.road || null,
          suburb: x.address?.suburb || x.address?.town || x.address?.village || x.address?.city_district || x.address?.city || null,
          postcode: x.address?.postcode || null,
          state: x.address?.state || null
        }));
        const body = { results: out, attribution: "Address data \xA9 OpenStreetMap contributors (ODbL)" };
        await store?.setJSON(key, { at: Date.now(), body }).catch(() => {
        });
        return json2(body);
      } catch (e) {
        return json2({ error: String(e.message || e) }, 502);
      }
    }, "default");
  }
});
var onRequest3;
var init_geocode2 = __esm({
  "api/geocode.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_geocode();
    init_cf();
    onRequest3 = wrap(geocode_default);
  }
});
function group3(path) {
  const p = String(path || "/").split(/[?#]/)[0].slice(0, 120).replace(/[^a-z0-9/_-]/gi, "") || "/";
  if (/^\/suburb\//.test(p)) return "/suburb/*";
  if (/^\/postcode\//.test(p)) return "/postcode/*";
  if (/^\/council\//.test(p)) return "/council/*";
  return p;
}
__name(group3, "group3");
var hit_default;
var init_hit = __esm({
  "../netlify/functions/hit.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_store();
    __name2(group3, "group");
    hit_default = /* @__PURE__ */ __name2(async (req) => {
      if (req.method !== "POST") return new Response(null, { status: 405 });
      let counted = false;
      try {
        const body = await req.text();
        const { p, e } = JSON.parse(body || "{}");
        const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const store = await getStore2("analytics");
        const ev = e ? String(e).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) : "";
        const key = ev ? `${day}/event/${ev}` : `${day}${group3(p)}`;
        const n = Number(await store.get(key)) || 0;
        await store.set(key, String(n + 1));
        counted = true;
      } catch {
      }
      return new Response(null, { status: 204, headers: { "cache-control": "no-store", "x-counted": String(counted) } });
    }, "default");
  }
});
var onRequest4;
var init_hit2 = __esm({
  "api/hit.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hit();
    init_cf();
    onRequest4 = wrap(hit_default);
  }
});
function parsePrice(text2) {
  if (!text2) return null;
  const t = String(text2).toLowerCase().replace(/,/g, "");
  const m = [...t.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*(m|mil|million|k|thousand)?/g)].map((x) => {
    let v = Number(x[1]);
    if (x[2]?.startsWith("m")) v *= 1e6;
    else if (x[2] === "k" || x[2] === "thousand") v *= 1e3;
    return v;
  }).filter((v) => v >= 5e4 && v <= 5e7);
  return m.length ? Math.min(...m) : null;
}
__name(parsePrice, "parsePrice");
var API;
var json3;
var STATES;
var listings_default;
var init_listings = __esm({
  "../netlify/functions/listings.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    API = "https://api.domain.com.au/v1/listings/residential/_search";
    json3 = /* @__PURE__ */ __name2((body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "netlify-cdn-cache-control": status === 200 ? "public, s-maxage=900, stale-while-revalidate=3600" : "no-store",
        ...extra
      }
    }), "json");
    __name2(parsePrice, "parsePrice");
    STATES = /* @__PURE__ */ new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
    listings_default = /* @__PURE__ */ __name2(async (req) => {
      const key = process.env.DOMAIN_API_KEY;
      if (!key) {
        return json3({ configured: false, message: "Live listings need a Domain API key. Add DOMAIN_API_KEY in Netlify > Site configuration > Environment variables." }, 200, { "netlify-cdn-cache-control": "no-store" });
      }
      const u = new URL(req.url);
      const suburb = (u.searchParams.get("suburb") || "").slice(0, 60);
      const state = (u.searchParams.get("state") || "").toUpperCase();
      const postcode = (u.searchParams.get("postcode") || "").replace(/\D/g, "").slice(0, 4);
      if (!suburb || !STATES.has(state)) return json3({ error: "suburb and state are required" }, 400);
      const types = (u.searchParams.get("types") || "").split(",").filter((x) => ["House", "ApartmentUnitFlat", "Townhouse", "Villa", "Duplex", "SemiDetached", "Terrace", "NewApartments", "NewHomeDesigns", "NewLand", "VacantLand"].includes(x));
      const listingType = u.searchParams.get("mode") === "rent" ? "Rent" : "Sale";
      const body = {
        listingType,
        pageSize: Math.min(40, Number(u.searchParams.get("size")) || 20),
        pageNumber: Math.max(1, Number(u.searchParams.get("page")) || 1),
        sort: { sortKey: "DateListed", direction: "Descending" },
        locations: [{ state, suburb, postCode: postcode || void 0, includeSurroundingSuburbs: u.searchParams.get("surrounding") === "1" }]
      };
      if (types.length) body.propertyTypes = types;
      const minBeds = Number(u.searchParams.get("beds"));
      if (minBeds) body.minBedrooms = minBeds;
      const maxPrice = Number(u.searchParams.get("max"));
      if (maxPrice) body.maxPrice = maxPrice;
      const minPrice = Number(u.searchParams.get("min"));
      if (minPrice) body.minPrice = minPrice;
      let r;
      try {
        r = await fetch(API, {
          method: "POST",
          headers: { "X-Api-Key": key, "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(12e3)
        });
      } catch (e) {
        return json3({ error: "Domain API did not respond", detail: String(e.message || e) }, 502);
      }
      if (!r.ok) {
        const text2 = await r.text();
        return json3({ error: `Domain API returned ${r.status}`, detail: text2.slice(0, 300) }, r.status === 429 ? 429 : 502);
      }
      const data = await r.json();
      const total = Number(r.headers.get("x-total-count")) || null;
      const items = [];
      for (const it of Array.isArray(data) ? data : []) {
        const listings = it.type === "Project" ? it.listings || [] : [it.listing];
        for (const l of listings) {
          if (!l) continue;
          const pd = l.propertyDetails || {};
          items.push({
            id: l.id,
            url: l.listingSlug ? `https://www.domain.com.au/${l.listingSlug}` : `https://www.domain.com.au/${l.id}`,
            address: pd.displayableAddress || [pd.unitNumber, pd.streetNumber, pd.street, pd.suburb].filter(Boolean).join(" "),
            suburb: pd.suburb,
            postcode: pd.postcode,
            type: pd.propertyType,
            beds: pd.bedrooms ?? null,
            baths: pd.bathrooms ?? null,
            cars: pd.carspaces ?? null,
            land: pd.landArea ?? null,
            lat: pd.latitude ?? null,
            lng: pd.longitude ?? null,
            displayPrice: l.priceDetails?.displayPrice || "",
            price: l.priceDetails?.price || parsePrice(l.priceDetails?.displayPrice),
            headline: l.headline || "",
            image: l.media?.find((m) => m.category === "Image")?.url || l.media?.[0]?.url || null,
            agency: l.advertiser?.name || "",
            listed: l.dateListed || null,
            isNew: !!(l.isNewDevelopment || /^New/.test(pd.propertyType || ""))
          });
        }
      }
      return json3({ configured: true, total, count: items.length, items, attribution: "Listings powered by Domain" });
    }, "default");
  }
});
var onRequest5;
var init_listings2 = __esm({
  "api/listings.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_listings();
    init_cf();
    onRequest5 = wrap(listings_default);
  }
});
async function fetchWithTimeout(url, opts = {}, ms = 2e4) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...opts,
      headers: { "user-agent": UA2, ...opts.headers || {} },
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(t);
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
async function getText(url, headers = {}, { retries = 2, timeout = 2e4 } = {}) {
  let last2;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetchWithTimeout(url, { headers }, timeout);
      if (r.status === 429 || r.status >= 500) {
        last2 = { ok: false, status: r.status, text: "" };
        await sleep2(800 * (i + 1));
        continue;
      }
      return { ok: r.ok, status: r.status, text: await r.text() };
    } catch (e) {
      last2 = { ok: false, status: 0, text: "", error: String(e.message || e) };
      await sleep2(500 * (i + 1));
    }
  }
  return last2;
}
__name(getText, "getText");
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        out[i] = await fn(items[i], i);
      } catch (e) {
        out[i] = { error: String(e.message || e) };
      }
    }
  }
  __name(worker, "worker");
  __name2(worker, "worker");
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}
__name(pool, "pool");
var UA2;
var sleep2;
var init_http = __esm({
  "../scripts/lib/http.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UA2 = "OwnarooBot/1.0 (+https://github.com/LAZARZEC18/keystone-property; public data refresh)";
    __name2(fetchWithTimeout, "fetchWithTimeout");
    __name2(getText, "getText");
    sleep2 = /* @__PURE__ */ __name2((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
    __name2(pool, "pool");
  }
});
var access;
var copyFile;
var cp;
var open;
var opendir;
var rename;
var truncate;
var rm;
var rmdir;
var mkdir;
var readdir;
var readlink;
var symlink;
var lstat;
var stat;
var link;
var unlink;
var chmod;
var lchmod;
var lchown;
var chown;
var utimes;
var lutimes;
var realpath;
var mkdtemp;
var writeFile;
var appendFile;
var readFile;
var watch;
var statfs;
var glob;
var init_promises = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    access = /* @__PURE__ */ notImplemented("fs.access");
    copyFile = /* @__PURE__ */ notImplemented("fs.copyFile");
    cp = /* @__PURE__ */ notImplemented("fs.cp");
    open = /* @__PURE__ */ notImplemented("fs.open");
    opendir = /* @__PURE__ */ notImplemented("fs.opendir");
    rename = /* @__PURE__ */ notImplemented("fs.rename");
    truncate = /* @__PURE__ */ notImplemented("fs.truncate");
    rm = /* @__PURE__ */ notImplemented("fs.rm");
    rmdir = /* @__PURE__ */ notImplemented("fs.rmdir");
    mkdir = /* @__PURE__ */ notImplemented("fs.mkdir");
    readdir = /* @__PURE__ */ notImplemented("fs.readdir");
    readlink = /* @__PURE__ */ notImplemented("fs.readlink");
    symlink = /* @__PURE__ */ notImplemented("fs.symlink");
    lstat = /* @__PURE__ */ notImplemented("fs.lstat");
    stat = /* @__PURE__ */ notImplemented("fs.stat");
    link = /* @__PURE__ */ notImplemented("fs.link");
    unlink = /* @__PURE__ */ notImplemented("fs.unlink");
    chmod = /* @__PURE__ */ notImplemented("fs.chmod");
    lchmod = /* @__PURE__ */ notImplemented("fs.lchmod");
    lchown = /* @__PURE__ */ notImplemented("fs.lchown");
    chown = /* @__PURE__ */ notImplemented("fs.chown");
    utimes = /* @__PURE__ */ notImplemented("fs.utimes");
    lutimes = /* @__PURE__ */ notImplemented("fs.lutimes");
    realpath = /* @__PURE__ */ notImplemented("fs.realpath");
    mkdtemp = /* @__PURE__ */ notImplemented("fs.mkdtemp");
    writeFile = /* @__PURE__ */ notImplemented("fs.writeFile");
    appendFile = /* @__PURE__ */ notImplemented("fs.appendFile");
    readFile = /* @__PURE__ */ notImplemented("fs.readFile");
    watch = /* @__PURE__ */ notImplemented("fs.watch");
    statfs = /* @__PURE__ */ notImplemented("fs.statfs");
    glob = /* @__PURE__ */ notImplemented("fs.glob");
  }
});
var constants_exports = {};
__export(constants_exports, {
  COPYFILE_EXCL: /* @__PURE__ */ __name(() => COPYFILE_EXCL, "COPYFILE_EXCL"),
  COPYFILE_FICLONE: /* @__PURE__ */ __name(() => COPYFILE_FICLONE, "COPYFILE_FICLONE"),
  COPYFILE_FICLONE_FORCE: /* @__PURE__ */ __name(() => COPYFILE_FICLONE_FORCE, "COPYFILE_FICLONE_FORCE"),
  EXTENSIONLESS_FORMAT_JAVASCRIPT: /* @__PURE__ */ __name(() => EXTENSIONLESS_FORMAT_JAVASCRIPT, "EXTENSIONLESS_FORMAT_JAVASCRIPT"),
  EXTENSIONLESS_FORMAT_WASM: /* @__PURE__ */ __name(() => EXTENSIONLESS_FORMAT_WASM, "EXTENSIONLESS_FORMAT_WASM"),
  F_OK: /* @__PURE__ */ __name(() => F_OK, "F_OK"),
  O_APPEND: /* @__PURE__ */ __name(() => O_APPEND, "O_APPEND"),
  O_CREAT: /* @__PURE__ */ __name(() => O_CREAT, "O_CREAT"),
  O_DIRECT: /* @__PURE__ */ __name(() => O_DIRECT, "O_DIRECT"),
  O_DIRECTORY: /* @__PURE__ */ __name(() => O_DIRECTORY, "O_DIRECTORY"),
  O_DSYNC: /* @__PURE__ */ __name(() => O_DSYNC, "O_DSYNC"),
  O_EXCL: /* @__PURE__ */ __name(() => O_EXCL, "O_EXCL"),
  O_NOATIME: /* @__PURE__ */ __name(() => O_NOATIME, "O_NOATIME"),
  O_NOCTTY: /* @__PURE__ */ __name(() => O_NOCTTY, "O_NOCTTY"),
  O_NOFOLLOW: /* @__PURE__ */ __name(() => O_NOFOLLOW, "O_NOFOLLOW"),
  O_NONBLOCK: /* @__PURE__ */ __name(() => O_NONBLOCK, "O_NONBLOCK"),
  O_RDONLY: /* @__PURE__ */ __name(() => O_RDONLY, "O_RDONLY"),
  O_RDWR: /* @__PURE__ */ __name(() => O_RDWR, "O_RDWR"),
  O_SYNC: /* @__PURE__ */ __name(() => O_SYNC, "O_SYNC"),
  O_TRUNC: /* @__PURE__ */ __name(() => O_TRUNC, "O_TRUNC"),
  O_WRONLY: /* @__PURE__ */ __name(() => O_WRONLY, "O_WRONLY"),
  R_OK: /* @__PURE__ */ __name(() => R_OK, "R_OK"),
  S_IFBLK: /* @__PURE__ */ __name(() => S_IFBLK, "S_IFBLK"),
  S_IFCHR: /* @__PURE__ */ __name(() => S_IFCHR, "S_IFCHR"),
  S_IFDIR: /* @__PURE__ */ __name(() => S_IFDIR, "S_IFDIR"),
  S_IFIFO: /* @__PURE__ */ __name(() => S_IFIFO, "S_IFIFO"),
  S_IFLNK: /* @__PURE__ */ __name(() => S_IFLNK, "S_IFLNK"),
  S_IFMT: /* @__PURE__ */ __name(() => S_IFMT, "S_IFMT"),
  S_IFREG: /* @__PURE__ */ __name(() => S_IFREG, "S_IFREG"),
  S_IFSOCK: /* @__PURE__ */ __name(() => S_IFSOCK, "S_IFSOCK"),
  S_IRGRP: /* @__PURE__ */ __name(() => S_IRGRP, "S_IRGRP"),
  S_IROTH: /* @__PURE__ */ __name(() => S_IROTH, "S_IROTH"),
  S_IRUSR: /* @__PURE__ */ __name(() => S_IRUSR, "S_IRUSR"),
  S_IRWXG: /* @__PURE__ */ __name(() => S_IRWXG, "S_IRWXG"),
  S_IRWXO: /* @__PURE__ */ __name(() => S_IRWXO, "S_IRWXO"),
  S_IRWXU: /* @__PURE__ */ __name(() => S_IRWXU, "S_IRWXU"),
  S_IWGRP: /* @__PURE__ */ __name(() => S_IWGRP, "S_IWGRP"),
  S_IWOTH: /* @__PURE__ */ __name(() => S_IWOTH, "S_IWOTH"),
  S_IWUSR: /* @__PURE__ */ __name(() => S_IWUSR, "S_IWUSR"),
  S_IXGRP: /* @__PURE__ */ __name(() => S_IXGRP, "S_IXGRP"),
  S_IXOTH: /* @__PURE__ */ __name(() => S_IXOTH, "S_IXOTH"),
  S_IXUSR: /* @__PURE__ */ __name(() => S_IXUSR, "S_IXUSR"),
  UV_DIRENT_BLOCK: /* @__PURE__ */ __name(() => UV_DIRENT_BLOCK, "UV_DIRENT_BLOCK"),
  UV_DIRENT_CHAR: /* @__PURE__ */ __name(() => UV_DIRENT_CHAR, "UV_DIRENT_CHAR"),
  UV_DIRENT_DIR: /* @__PURE__ */ __name(() => UV_DIRENT_DIR, "UV_DIRENT_DIR"),
  UV_DIRENT_FIFO: /* @__PURE__ */ __name(() => UV_DIRENT_FIFO, "UV_DIRENT_FIFO"),
  UV_DIRENT_FILE: /* @__PURE__ */ __name(() => UV_DIRENT_FILE, "UV_DIRENT_FILE"),
  UV_DIRENT_LINK: /* @__PURE__ */ __name(() => UV_DIRENT_LINK, "UV_DIRENT_LINK"),
  UV_DIRENT_SOCKET: /* @__PURE__ */ __name(() => UV_DIRENT_SOCKET, "UV_DIRENT_SOCKET"),
  UV_DIRENT_UNKNOWN: /* @__PURE__ */ __name(() => UV_DIRENT_UNKNOWN, "UV_DIRENT_UNKNOWN"),
  UV_FS_COPYFILE_EXCL: /* @__PURE__ */ __name(() => UV_FS_COPYFILE_EXCL, "UV_FS_COPYFILE_EXCL"),
  UV_FS_COPYFILE_FICLONE: /* @__PURE__ */ __name(() => UV_FS_COPYFILE_FICLONE, "UV_FS_COPYFILE_FICLONE"),
  UV_FS_COPYFILE_FICLONE_FORCE: /* @__PURE__ */ __name(() => UV_FS_COPYFILE_FICLONE_FORCE, "UV_FS_COPYFILE_FICLONE_FORCE"),
  UV_FS_O_FILEMAP: /* @__PURE__ */ __name(() => UV_FS_O_FILEMAP, "UV_FS_O_FILEMAP"),
  UV_FS_SYMLINK_DIR: /* @__PURE__ */ __name(() => UV_FS_SYMLINK_DIR, "UV_FS_SYMLINK_DIR"),
  UV_FS_SYMLINK_JUNCTION: /* @__PURE__ */ __name(() => UV_FS_SYMLINK_JUNCTION, "UV_FS_SYMLINK_JUNCTION"),
  W_OK: /* @__PURE__ */ __name(() => W_OK, "W_OK"),
  X_OK: /* @__PURE__ */ __name(() => X_OK, "X_OK")
});
var UV_FS_SYMLINK_DIR;
var UV_FS_SYMLINK_JUNCTION;
var O_RDONLY;
var O_WRONLY;
var O_RDWR;
var UV_DIRENT_UNKNOWN;
var UV_DIRENT_FILE;
var UV_DIRENT_DIR;
var UV_DIRENT_LINK;
var UV_DIRENT_FIFO;
var UV_DIRENT_SOCKET;
var UV_DIRENT_CHAR;
var UV_DIRENT_BLOCK;
var EXTENSIONLESS_FORMAT_JAVASCRIPT;
var EXTENSIONLESS_FORMAT_WASM;
var S_IFMT;
var S_IFREG;
var S_IFDIR;
var S_IFCHR;
var S_IFBLK;
var S_IFIFO;
var S_IFLNK;
var S_IFSOCK;
var O_CREAT;
var O_EXCL;
var UV_FS_O_FILEMAP;
var O_NOCTTY;
var O_TRUNC;
var O_APPEND;
var O_DIRECTORY;
var O_NOATIME;
var O_NOFOLLOW;
var O_SYNC;
var O_DSYNC;
var O_DIRECT;
var O_NONBLOCK;
var S_IRWXU;
var S_IRUSR;
var S_IWUSR;
var S_IXUSR;
var S_IRWXG;
var S_IRGRP;
var S_IWGRP;
var S_IXGRP;
var S_IRWXO;
var S_IROTH;
var S_IWOTH;
var S_IXOTH;
var F_OK;
var R_OK;
var W_OK;
var X_OK;
var UV_FS_COPYFILE_EXCL;
var COPYFILE_EXCL;
var UV_FS_COPYFILE_FICLONE;
var COPYFILE_FICLONE;
var UV_FS_COPYFILE_FICLONE_FORCE;
var COPYFILE_FICLONE_FORCE;
var init_constants = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/internal/fs/constants.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UV_FS_SYMLINK_DIR = 1;
    UV_FS_SYMLINK_JUNCTION = 2;
    O_RDONLY = 0;
    O_WRONLY = 1;
    O_RDWR = 2;
    UV_DIRENT_UNKNOWN = 0;
    UV_DIRENT_FILE = 1;
    UV_DIRENT_DIR = 2;
    UV_DIRENT_LINK = 3;
    UV_DIRENT_FIFO = 4;
    UV_DIRENT_SOCKET = 5;
    UV_DIRENT_CHAR = 6;
    UV_DIRENT_BLOCK = 7;
    EXTENSIONLESS_FORMAT_JAVASCRIPT = 0;
    EXTENSIONLESS_FORMAT_WASM = 1;
    S_IFMT = 61440;
    S_IFREG = 32768;
    S_IFDIR = 16384;
    S_IFCHR = 8192;
    S_IFBLK = 24576;
    S_IFIFO = 4096;
    S_IFLNK = 40960;
    S_IFSOCK = 49152;
    O_CREAT = 64;
    O_EXCL = 128;
    UV_FS_O_FILEMAP = 0;
    O_NOCTTY = 256;
    O_TRUNC = 512;
    O_APPEND = 1024;
    O_DIRECTORY = 65536;
    O_NOATIME = 262144;
    O_NOFOLLOW = 131072;
    O_SYNC = 1052672;
    O_DSYNC = 4096;
    O_DIRECT = 16384;
    O_NONBLOCK = 2048;
    S_IRWXU = 448;
    S_IRUSR = 256;
    S_IWUSR = 128;
    S_IXUSR = 64;
    S_IRWXG = 56;
    S_IRGRP = 32;
    S_IWGRP = 16;
    S_IXGRP = 8;
    S_IRWXO = 7;
    S_IROTH = 4;
    S_IWOTH = 2;
    S_IXOTH = 1;
    F_OK = 0;
    R_OK = 4;
    W_OK = 2;
    X_OK = 1;
    UV_FS_COPYFILE_EXCL = 1;
    COPYFILE_EXCL = 1;
    UV_FS_COPYFILE_FICLONE = 2;
    COPYFILE_FICLONE = 2;
    UV_FS_COPYFILE_FICLONE_FORCE = 4;
    COPYFILE_FICLONE_FORCE = 4;
  }
});
var promises_exports = {};
__export(promises_exports, {
  access: /* @__PURE__ */ __name(() => access, "access"),
  appendFile: /* @__PURE__ */ __name(() => appendFile, "appendFile"),
  chmod: /* @__PURE__ */ __name(() => chmod, "chmod"),
  chown: /* @__PURE__ */ __name(() => chown, "chown"),
  constants: /* @__PURE__ */ __name(() => constants_exports, "constants"),
  copyFile: /* @__PURE__ */ __name(() => copyFile, "copyFile"),
  cp: /* @__PURE__ */ __name(() => cp, "cp"),
  default: /* @__PURE__ */ __name(() => promises_default, "default"),
  glob: /* @__PURE__ */ __name(() => glob, "glob"),
  lchmod: /* @__PURE__ */ __name(() => lchmod, "lchmod"),
  lchown: /* @__PURE__ */ __name(() => lchown, "lchown"),
  link: /* @__PURE__ */ __name(() => link, "link"),
  lstat: /* @__PURE__ */ __name(() => lstat, "lstat"),
  lutimes: /* @__PURE__ */ __name(() => lutimes, "lutimes"),
  mkdir: /* @__PURE__ */ __name(() => mkdir, "mkdir"),
  mkdtemp: /* @__PURE__ */ __name(() => mkdtemp, "mkdtemp"),
  open: /* @__PURE__ */ __name(() => open, "open"),
  opendir: /* @__PURE__ */ __name(() => opendir, "opendir"),
  readFile: /* @__PURE__ */ __name(() => readFile, "readFile"),
  readdir: /* @__PURE__ */ __name(() => readdir, "readdir"),
  readlink: /* @__PURE__ */ __name(() => readlink, "readlink"),
  realpath: /* @__PURE__ */ __name(() => realpath, "realpath"),
  rename: /* @__PURE__ */ __name(() => rename, "rename"),
  rm: /* @__PURE__ */ __name(() => rm, "rm"),
  rmdir: /* @__PURE__ */ __name(() => rmdir, "rmdir"),
  stat: /* @__PURE__ */ __name(() => stat, "stat"),
  statfs: /* @__PURE__ */ __name(() => statfs, "statfs"),
  symlink: /* @__PURE__ */ __name(() => symlink, "symlink"),
  truncate: /* @__PURE__ */ __name(() => truncate, "truncate"),
  unlink: /* @__PURE__ */ __name(() => unlink, "unlink"),
  utimes: /* @__PURE__ */ __name(() => utimes, "utimes"),
  watch: /* @__PURE__ */ __name(() => watch, "watch"),
  writeFile: /* @__PURE__ */ __name(() => writeFile, "writeFile")
});
var promises_default;
var init_promises2 = __esm({
  "../../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/unenv/dist/runtime/node/fs/promises.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_promises();
    init_constants();
    init_promises();
    promises_default = {
      constants: constants_exports,
      access,
      appendFile,
      chmod,
      chown,
      copyFile,
      cp,
      glob,
      lchmod,
      lchown,
      link,
      lstat,
      lutimes,
      mkdir,
      mkdtemp,
      open,
      opendir,
      readFile,
      readdir,
      readlink,
      realpath,
      rename,
      rm,
      rmdir,
      stat,
      statfs,
      symlink,
      truncate,
      unlink,
      utimes,
      watch,
      writeFile
    };
  }
});
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title2 = decode(tag(b, "title"));
    let link2 = decode(tag(b, "link"));
    if (!link2) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      link2 = m ? m[1] : "";
    }
    const dateStr = decode(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    const d = dateStr ? new Date(dateStr) : null;
    const publisher = decode(tag(b, "source"));
    if (title2 && link2) items.push({ title: title2, link: link2, date: d && !Number.isNaN(+d) ? d.toISOString() : null, publisher });
  }
  return items;
}
__name(parseFeed, "parseFeed");
async function collectNews({ now = Date.now(), timeout = 15e3 } = {}) {
  const results = await pool(FEEDS, 8, async (f) => {
    const r = await getText(f.url, { accept: "application/rss+xml, application/atom+xml, text/xml" }, { timeout, retries: timeout < 1e4 ? 0 : void 0 });
    if (!r?.ok) return { feed: f, items: [], error: r?.status };
    return { feed: f, items: parseFeed(r.text) };
  });
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const { feed, items } of results) {
    for (const it of items) {
      let title2 = it.title;
      let source = feed.source;
      if (feed.aggregator) {
        const m = title2.match(/^(.*) - ([^-]{2,60})$/);
        if (m) {
          title2 = m[1];
          source = it.publisher || m[2];
        }
        const pub = PUBLISHERS.get(normPub(source));
        if (!pub) continue;
        source = pub;
      }
      if (/[\u0400-\u04FF\u0600-\u06FF\u3040-\u9FFF]/.test(source + title2)) continue;
      if (BLOCK.test(title2)) continue;
      if (!RELEVANT.test(title2)) continue;
      const age = it.date ? now - Date.parse(it.date) : 0;
      if (age > 14 * 864e5) continue;
      const key = norm(title2).slice(0, 70);
      if (seen.has(key)) continue;
      seen.add(key);
      const tags = TAGS.filter(([, re]) => re.test(title2)).map(([t]) => t).slice(0, 2);
      out.push({ title: title2, link: it.link, source, date: it.date, tags });
    }
  }
  out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const count3 = {};
  const HYPE = /tipped to boom|\bboom(ing)?\b|skyrocket|soar(ing)?|hotspots?|\breveals?\b|\brevealed\b|you need to know|must[- ]know|secret|millionaire|\bhacks?\b|\bthe \d+ (best|worst)|\b(five|\d+) (markets|suburbs|places) (to|where)/i;
  const PROFILE = /'s (leap|journey|story)\b|\bmeet the\b/i;
  for (let i = out.length - 1; i >= 0; i--) if (HYPE.test(out[i].title) || PROFILE.test(out[i].title)) out.splice(i, 1);
  const curated = out.filter((x) => (count3[x.source] = (count3[x.source] || 0) + 1) <= (PER_SOURCE[x.source] ?? 5)).slice(0, 30);
  return {
    updated: new Date(now).toISOString(),
    feeds: results.map((r) => ({ source: r.feed.source, ok: !r.error, count: r.items.length })),
    items: curated
  };
}
__name(collectNews, "collectNews");
var FEEDS;
var RELEVANT;
var BLOCK;
var PER_SOURCE;
var PUBLISHERS;
var normPub;
var TAGS;
var decode;
var tag;
var norm;
var init_news = __esm({
  "../scripts/news.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_http();
    FEEDS = [
      { source: "RBA", url: "https://www.rba.gov.au/rss/rss-cb-media-releases.xml", all: true },
      // portal news is filtered like any other feed (it carries celebrity and lifestyle pieces)
      { source: "PropTrack", url: "https://www.realestate.com.au/insights/feed/", all: true },
      { source: "The Conversation", url: "https://theconversation.com/au/topics/housing-1109/articles.atom", all: true },
      { source: "The Guardian", url: "https://www.theguardian.com/australia-news/housing/rss", all: true },
      { source: "ABC News", url: "https://www.abc.net.au/news/feed/51892/rss.xml" },
      { source: "ABC News", url: "https://www.abc.net.au/news/feed/2942460/rss.xml" },
      { source: "The Guardian", url: "https://www.theguardian.com/australia-news/rss" },
      { source: "Broker News", url: "https://www.brokernews.com.au/rss" },
      { source: "SBS News", url: "https://www.sbs.com.au/news/topic/australia/feed" }
      // Google News was dropped: its links go through news.google.com redirects rather than to the publisher
    ];
    RELEVANT = /\b(housing|house prices?|home prices?|property (market|prices?|values?|investors?)|home ?loans?|home ?buyers?|first[- ]home|mortgages?|rents?|rental|renters?|tenants?|landlords?|interest rates?|cash rate|RBA|reserve bank|APRA|auction clearance|clearance rates?|dwelling (values?|prices?|approvals)|stamp duty|negative gearing|capital gains|land tax|affordab\w*|lending|borrowers?|CPI|inflation|building approvals|housing supply|vacancy rates?|home values?|median (price|value)|monetary policy)\b/i;
    BLOCK = /\b(mansion|celebrit\w*|star|actor|actress|singer|rapper|influencer|reality|AFL|NRL|cricket|footballer|olympian|swimmer|resigns?|resignation|ICAC|court|charged|police|taser|murder|crash|dies|death|royal|billionaire'?s?|lists? (her|his|their)|sells? (her|his|their)|snaps? up|buys? (a|her|his|their))\b/i;
    PER_SOURCE = { "realestate.com.au": 3, PropTrack: 3, Domain: 3 };
    PUBLISHERS = /* @__PURE__ */ new Map(
      [
        ["abc", "ABC News"],
        ["abc news", "ABC News"],
        ["sbs", "SBS News"],
        ["sbs news", "SBS News"],
        ["the guardian", "The Guardian"],
        ["guardian", "The Guardian"],
        ["australian financial review", "Australian Financial Review"],
        ["afr", "Australian Financial Review"],
        ["the sydney morning herald", "The Sydney Morning Herald"],
        ["sydney morning herald", "The Sydney Morning Herald"],
        ["the age", "The Age"],
        ["brisbane times", "Brisbane Times"],
        ["watoday", "WAtoday"],
        ["news.com.au", "news.com.au"],
        ["the australian", "The Australian"],
        ["the west australian", "The West Australian"],
        ["perthnow", "PerthNow"],
        ["perth now", "PerthNow"],
        ["herald sun", "Herald Sun"],
        ["the daily telegraph", "The Daily Telegraph"],
        ["daily telegraph", "The Daily Telegraph"],
        ["the courier-mail", "The Courier-Mail"],
        ["courier mail", "The Courier-Mail"],
        ["adelaide now", "The Advertiser"],
        ["the advertiser", "The Advertiser"],
        ["indaily", "InDaily"],
        ["the mercury", "The Mercury"],
        ["nt news", "NT News"],
        ["the canberra times", "The Canberra Times"],
        ["9news", "9News"],
        ["9news.com.au", "9News"],
        ["7news", "7NEWS"],
        ["7news.com.au", "7NEWS"],
        ["sky news australia", "Sky News Australia"],
        ["reuters", "Reuters"],
        ["bloomberg", "Bloomberg"],
        ["bloomberg.com", "Bloomberg"],
        ["yahoo finance", "Yahoo Finance"],
        ["yahoo finance australia", "Yahoo Finance"],
        ["yahoo news australia", "Yahoo Finance"],
        ["yahoo", "Yahoo Finance"],
        ["realestate.com.au", "realestate.com.au"],
        ["domain", "Domain"],
        ["domain.com.au", "Domain"],
        ["proptrack", "PropTrack"],
        ["cotality", "Cotality"],
        ["corelogic", "Cotality"],
        ["the conversation", "The Conversation"],
        ["canstar", "Canstar"],
        ["finder", "Finder"],
        ["ratecity", "RateCity"],
        ["mozo", "Mozo"],
        ["money magazine", "Money Magazine"],
        ["the adviser", "The Adviser"],
        ["broker daily", "Broker Daily"],
        ["brokerdaily", "Broker Daily"],
        ["mortgage professional australia", "Mortgage Professional Australia"],
        ["mpa", "Mortgage Professional Australia"],
        ["real estate business", "Real Estate Business"],
        ["your investment property", "Your Investment Property"],
        ["property update", "Property Update"],
        ["smart property investment", "Smart Property Investment"],
        ["business insider australia", "Business Insider Australia"],
        ["the new daily", "The New Daily"],
        ["crikey", "Crikey"],
        ["reserve bank of australia", "RBA"],
        ["rba", "RBA"]
      ]
    );
    normPub = /* @__PURE__ */ __name2((x) => String(x || "").toLowerCase().replace(/^www\./, "").replace(/\s+/g, " ").trim(), "normPub");
    TAGS = [
      ["Rates", /interest rate|cash rate|\bRBA\b|reserve bank|mortgage rate|rate (cut|hike|rise|hold)|fixed rate|variable rate|lender|refinanc/i],
      ["Prices", /\bprices?\b|\bvalues?\b|index|clearance rate|boom|slump|median|market (rise|fall|growth|slow|cool)/i],
      ["Rents", /rent|tenant|landlord|vacanc|lease/i],
      ["Policy", /\btax|stamp duty|negative gearing|budget|government|policy|scheme|home owners? grant|regulat|apra|zoning|planning|\blaws?\b|\brules?\b|registration|reform|legislation/i],
      ["Supply", /construction|build|approval|supply|developer|apartment|land release|housing target/i],
      ["Lending", /loan|lending|credit|borrow|serviceab|deposit|broker|bank/i]
    ];
    decode = /* @__PURE__ */ __name2((s = "") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#8217;|&rsquo;/g, "\u2019").replace(/&#8216;|&lsquo;/g, "\u2018").replace(/&#8220;|&ldquo;/g, "\u201C").replace(/&#8221;|&rdquo;/g, "\u201D").replace(/&#8211;|&ndash;/g, "\u2013").replace(/&#8212;|&mdash;/g, "\u2014").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim(), "decode");
    tag = /* @__PURE__ */ __name2((xml, name) => {
      const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
      return m ? m[1] : "";
    }, "tag");
    __name2(parseFeed, "parseFeed");
    norm = /* @__PURE__ */ __name2((t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(), "norm");
    __name2(collectNews, "collectNews");
    if (typeof process !== "undefined" && process.argv && import.meta.url === `file://${process.argv[1]}`) {
      (async () => {
        const { writeFile: writeFile2, mkdir: mkdir2 } = await Promise.resolve().then(() => (init_promises2(), promises_exports));
        const d = await collectNews();
        await mkdir2(new URL("../site/data/", import.meta.url), { recursive: true });
        await writeFile2(new URL("../site/data/news.json", import.meta.url), JSON.stringify(d));
        console.log(d.items.length, "items;", d.feeds.map((f) => `${f.source}:${f.ok ? f.count : "x"}`).join(" "));
      })();
    }
  }
});
function parseCsv(text2) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text2.length; i++) {
    const c = text2[i];
    if (q) {
      if (c === '"' && text2[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text2[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
__name(parseCsv, "parseCsv");
function rbaDate(s) {
  s = (s || "").trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m) {
    const mon = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[2]) / 3 + 1;
    return `${m[3]}-${String(mon).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}
__name(rbaDate, "rbaDate");
function parseRbaTable(text2) {
  const rows = parseCsv(text2.replace(/^﻿/, ""));
  const titleRow = rows.find((r) => r[0] === "Title") || [];
  const idRow = rows.find((r) => r[0] === "Series ID");
  const pubRow = rows.find((r) => r[0] === "Publication date");
  if (!idRow) throw new Error("No Series ID row");
  const start = rows.indexOf(idRow) + 1;
  const titles = {};
  const series = {};
  idRow.slice(1).forEach((id, j) => {
    if (!id) return;
    titles[id] = titleRow[j + 1] || id;
    series[id] = [];
  });
  for (const r of rows.slice(start)) {
    const d = rbaDate(r[0]);
    if (!d) continue;
    idRow.slice(1).forEach((id, j) => {
      if (!id) return;
      const raw = (r[j + 1] || "").trim();
      if (raw === "") return;
      const v = Number(raw);
      series[id].push([d, Number.isFinite(v) ? v : raw]);
    });
  }
  return { titles, series, published: rbaDate(pubRow?.[1]) };
}
__name(parseRbaTable, "parseRbaTable");
async function collectRba() {
  const tables = {};
  for (const t of ["a2", "f5", "f6", "f1.1"]) {
    const r = await getText(`${BASE}${t}-data.csv`);
    if (!r.ok) throw new Error(`RBA ${t} ${r.status}`);
    tables[t] = parseRbaTable(r.text);
  }
  const a2 = tables.a2.series;
  const decisions = (a2.ARBAMPCNCRT || []).filter(([, v]) => typeof v === "number").map(([d, v]) => ({ date: d, rate: v }));
  const changes = decisions.map((x, i) => ({ ...x, change: i ? Math.round((x.rate - decisions[i - 1].rate) * 100) : null }));
  const f5 = tables.f5.series;
  const f6 = tables.f6;
  const pickF6 = /* @__PURE__ */ __name2((re) => Object.keys(f6.titles).find((id) => re.test(f6.titles[id])), "pickF6");
  const f6ids = {
    newOOVariable: pickF6(/New loans funded.*Owner-occupied; Variable-rate; All institutions/i) || pickF6(/New.*Owner-occupied; Variable-rate; All/i),
    newInvVariable: pickF6(/New loans funded.*Investment; Variable-rate; All institutions/i) || pickF6(/New.*Investment; Variable-rate; All/i),
    newOOFixed: pickF6(/New.*Owner-occupied; Fixed-rate; ≤ 3 years|New.*Owner-occupied; Fixed.*less than|New.*Owner-occupied; Fixed-rate.*All/i),
    newInvFixed: pickF6(/New.*Investment; Fixed-rate; ≤ 3 years|New.*Investment; Fixed.*less than|New.*Investment; Fixed-rate.*All/i),
    outInv: pickF6(/Outstanding; Investment; All loans; All institutions/i),
    outOO: pickF6(/Outstanding; Owner-occupied; All loans; All institutions/i)
  };
  const f1 = tables["f1.1"].series;
  const monthly = /* @__PURE__ */ __name2((id, s) => since(s[id], "2005-01-01"), "monthly");
  return {
    updated: (/* @__PURE__ */ new Date()).toISOString(),
    source: "Reserve Bank of Australia statistical tables A2, F1.1, F5, F6",
    cashRate: {
      current: last(changes)?.rate ?? null,
      lastChange: [...changes].reverse().find((c) => c.change)?.date ?? null,
      decisions: changes.filter((c) => c.date >= "2000-01-01"),
      published: tables.a2.published
    },
    market: {
      // Bank bill rates run ahead of the cash rate: 6-month bills above the cash rate mean
      // markets are pricing a rise, below means a cut. (RBA stopped publishing OIS in 2022.)
      bab1m: last(f1.FIRMMBAB30)?.[1] ?? null,
      bab3m: last(f1.FIRMMBAB90)?.[1] ?? null,
      bab6m: last(f1.FIRMMBAB180)?.[1] ?? null,
      asAt: last(f1.FIRMMBAB90)?.[0] ?? null,
      published: tables["f1.1"].published
    },
    indicator: {
      published: tables.f5.published,
      ooStandardVariable: monthly("FILRHLBVS", f5),
      ooDiscountedVariable: monthly("FILRHLBVD", f5),
      oo3yFixed: monthly("FILRHL3YF", f5),
      invStandardVariable: monthly("FILRHLBVSI", f5),
      invDiscountedVariable: monthly("FILRHLBVDI", f5),
      inv3yFixed: monthly("FILRHL3YFI", f5)
    },
    actual: {
      published: f6.published,
      titles: Object.fromEntries(Object.entries(f6ids).map(([k, id]) => [k, id ? f6.titles[id] : null])),
      ...Object.fromEntries(Object.entries(f6ids).map(([k, id]) => [k, id ? monthly(id, f6.series) : []]))
    }
  };
}
__name(collectRba, "collectRba");
var BASE;
var last;
var since;
var init_rba = __esm({
  "../scripts/rba.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_http();
    BASE = "https://www.rba.gov.au/statistics/tables/csv/";
    __name2(parseCsv, "parseCsv");
    __name2(rbaDate, "rbaDate");
    __name2(parseRbaTable, "parseRbaTable");
    last = /* @__PURE__ */ __name2((arr) => arr && arr.length ? arr[arr.length - 1] : null, "last");
    since = /* @__PURE__ */ __name2((arr, from) => (arr || []).filter(([d]) => d >= from), "since");
    __name2(collectRba, "collectRba");
    if (typeof process !== "undefined" && process.argv && import.meta.url === `file://${process.argv[1]}`) {
      (async () => {
        const { writeFile: writeFile2, mkdir: mkdir2 } = await Promise.resolve().then(() => (init_promises2(), promises_exports));
        const d = await collectRba();
        await mkdir2(new URL("../site/data/", import.meta.url), { recursive: true });
        await writeFile2(new URL("../site/data/rba.json", import.meta.url), JSON.stringify(d));
        console.log("cash", d.cashRate.current, d.cashRate.lastChange, "bab6m", d.market.bab6m, d.actual.titles);
      })();
    }
  }
});
var json4;
var live_default;
var init_live = __esm({
  "../netlify/functions/live.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_news();
    init_rba();
    json4 = /* @__PURE__ */ __name2((body, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "netlify-cdn-cache-control": status === 200 ? "public, s-maxage=1800, stale-while-revalidate=86400" : "no-store"
      }
    }), "json");
    live_default = /* @__PURE__ */ __name2(async (req) => {
      const name = new URL(req.url).pathname.replace(/^\/api\/live-/, "");
      try {
        if (name === "news") {
          const d = await collectNews({ timeout: 8e3 });
          if (d.items.length < 10) throw new Error("too few headlines");
          return json4({ ...d, live: true });
        }
        if (name === "rba") {
          const d = await collectRba();
          if (!d?.cashRate?.current) throw new Error("no cash rate");
          return json4({ ...d, live: true });
        }
        return json4({ error: "unknown feed" }, 404);
      } catch (e) {
        return json4({ error: String(e.message || e) }, 502);
      }
    }, "default");
  }
});
var onRequest6;
var init_live_news = __esm({
  "api/live-news.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_live();
    init_cf();
    onRequest6 = wrap(live_default);
  }
});
var onRequest7;
var init_live_rba = __esm({
  "api/live-rba.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_live();
    init_cf();
    onRequest7 = wrap(live_default);
  }
});
function toPhoto(p) {
  const ii = p.imageinfo?.[0];
  if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || "")) return null;
  const m = ii.extmetadata || {};
  const license = text(m.LicenseShortName?.value);
  if (!license || /fair use|non-free/i.test(license)) return null;
  return {
    title: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " "),
    thumb: ii.thumburl,
    width: ii.thumbwidth,
    height: ii.thumbheight,
    page: ii.descriptionurl,
    artist: text(m.Artist?.value).replace(/^.*derivative work:?\s*/i, "").replace(/^File:\S+\s*/i, "").slice(0, 60) || "Unknown",
    license,
    licenseUrl: m.LicenseUrl?.value || "",
    categories: m.Categories?.value || "",
    big: (ii.width || 0) * (ii.height || 0)
  };
}
__name(toPhoto, "toPhoto");
async function nearby(lat, lng, name, n) {
  const q = new URLSearchParams({ action: "query", generator: "geosearch", ggscoord: `${lat}|${lng}`, ggsradius: "2500", ggsnamespace: "6", ggslimit: "50", prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "960", format: "json", formatversion: "2" });
  const d = await get(`${API2}?${q}`);
  const nm = String(name || "").toLowerCase().replace(/\s*\(.*\)/, "");
  const scored = (d.query?.pages || []).map(toPhoto).filter(Boolean).filter((x) => !JUNK.test(x.title) && !BADCAT.test(x.categories) && x.width >= 600 && x.width / x.height >= 1 && x.width / x.height <= 2.6).map((x) => {
    let s = 0;
    const hay = `${x.title} ${x.categories}`.toLowerCase();
    if (nm && hay.includes(nm)) s += 3;
    if (GOOD.test(x.title)) s += 3;
    else if (OK.test(x.title)) s += 1;
    if (GOOD.test(x.categories)) s += 1;
    if (/quality images|featured pictures|valued images/i.test(x.categories)) s += 2;
    if (x.big > 3e6) s += 1;
    const scenic = GOOD.test(x.title) || GOOD.test(x.categories) || /quality images|featured pictures|valued images/i.test(x.categories);
    return { ...x, s, scenic };
  }).filter((x) => x.scenic && x.s >= 3).sort((a, b) => b.s - a.s || b.big - a.big);
  const seen = {};
  return scored.filter((x) => (seen[x.title.slice(0, 18)] = (seen[x.title.slice(0, 18)] || 0) + 1) <= 2).slice(0, n);
}
__name(nearby, "nearby");
async function lead(title2) {
  const w = await get(`https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: "query", titles: title2, prop: "pageimages", piprop: "name", format: "json", formatversion: "2", redirects: "1" })}`);
  const file = w.query?.pages?.[0]?.pageimage;
  if (!file || /\.svg$/i.test(file) || JUNK.test(file)) return [];
  const d = await get(`${API2}?${new URLSearchParams({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "960", format: "json", formatversion: "2" })}`);
  return (d.query?.pages || []).map(toPhoto).filter(Boolean);
}
__name(lead, "lead");
var UA3;
var API2;
var json5;
var get;
var text;
var JUNK;
var GOOD;
var OK;
var BADCAT;
var photos_default;
var init_photos = __esm({
  "../netlify/functions/photos.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UA3 = "OwnarooBot/1.0 (https://github.com/LAZARZEC18/keystone-property; Keyzing18@gmail.com) property research site";
    API2 = "https://commons.wikimedia.org/w/api.php";
    json5 = /* @__PURE__ */ __name2((body, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=86400",
        "netlify-cdn-cache-control": status === 200 ? "public, s-maxage=2592000, stale-while-revalidate=604800" : "no-store"
      }
    }), "json");
    get = /* @__PURE__ */ __name2(async (url) => {
      const r = await fetch(url, { headers: { "user-agent": UA3, "api-user-agent": UA3 }, signal: AbortSignal.timeout(8e3) });
      if (!r.ok) throw new Error(`wikimedia ${r.status}`);
      return r.json();
    }, "get");
    text = /* @__PURE__ */ __name2((html = "") => String(html).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim(), "text");
    JUNK = /\b(construction|under construction|works|roadworks|car ?park|carpark|facade|shopfront|shop front|galleria|shopping (centre|center|mall)|mall|supermarket|market front|library|station|platform|bus (station|interchange)|ISS\d*|view of earth|astronaut|satellite|landsat|airport|aerodrome|helicopters?|hangars?|runway|aircraft|logo|map|locator|location map|diagram|chart|plaque|sign(age)?|phones?|aed|interior|toilet|menu|receipt|screenshot|mcdonald'?s|kfc|hungry jack'?s|realme|iphone|samsung|bus stop pole|timetable|graffiti|rubbish|bin|coat of arms|flag|seal)\b/i;
    GOOD = /\b(street|streetscape|house|houses|home|homes|residential|park|reserve|lake|beach|foreshore|river|view|panorama|skyline|aerial|jetty|pier|coast|bushland|lookout|sunset|garden|trees)\b/i;
    OK = /\b(road|avenue|oval|station|shops|church|school|library|hall|cafe|market)\b/i;
    BADCAT = /\b(animals?|insects?|birds?|species|taxa|fungi|plants? by|mobile phones|people|portraits|vehicles by|aircraft|logos)\b/i;
    __name2(toPhoto, "toPhoto");
    __name2(nearby, "nearby");
    __name2(lead, "lead");
    photos_default = /* @__PURE__ */ __name2(async (req) => {
      const u = new URL(req.url).searchParams;
      try {
        const n = Math.max(1, Math.min(8, +u.get("n") || 6));
        let photos = [];
        if (u.get("wiki")) photos = await lead(u.get("wiki").slice(0, 120));
        else {
          const lat = +u.get("lat");
          const lng = +u.get("lng");
          if (!(lat < -9 && lat > -45 && lng > 110 && lng < 155)) return json5({ error: "coordinates outside Australia" }, 400);
          photos = await nearby(lat.toFixed(4), lng.toFixed(4), u.get("name"), n);
          const STATE = { NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland", SA: "South Australia", WA: "Western Australia", TAS: "Tasmania", NT: "Northern Territory", ACT: "Australian Capital Territory" }[u.get("state")];
          if (photos.length < 2 && u.get("name") && STATE) {
            const extra = await lead(`${u.get("name").replace(/\s*\(.*\)/, "")}, ${STATE}`).catch(() => []);
            photos = [...extra.filter((x) => !photos.some((p) => p.page === x.page)), ...photos].slice(0, n);
          }
        }
        return json5({ photos: photos.map(({ categories, big, s, scenic, ...p }) => p), source: "Wikimedia Commons" });
      } catch (e) {
        return json5({ error: String(e.message || e) }, 502);
      }
    }, "default");
  }
});
var onRequest8;
var init_photos2 = __esm({
  "api/photos.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_photos();
    init_cf();
    onRequest8 = wrap(photos_default);
  }
});
var API3;
var json6;
var property_default;
var init_property = __esm({
  "../netlify/functions/property.mjs"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    API3 = "https://api.domain.com.au/v1";
    json6 = /* @__PURE__ */ __name2((body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "netlify-cdn-cache-control": status === 200 ? "public, s-maxage=86400" : "no-store",
        ...extra
      }
    }), "json");
    property_default = /* @__PURE__ */ __name2(async (req) => {
      const key = process.env.DOMAIN_API_KEY;
      if (!key) return json6({ configured: false }, 200, { "netlify-cdn-cache-control": "no-store" });
      const q = String(req.method === "POST" ? (await req.json().catch(() => ({}))).q || "" : new URL(req.url).searchParams.get("q") || "").trim().slice(0, 160);
      if (q.length < 5) return json6({ error: "address too short" }, 400);
      const h = { "X-Api-Key": key, accept: "application/json" };
      try {
        const s = await fetch(`${API3}/properties/_suggest?${new URLSearchParams({ terms: q, pageSize: "1", channel: "All" })}`, { headers: h, signal: AbortSignal.timeout(8e3) });
        if (!s.ok) return json6({ configured: true, error: `suggest ${s.status}` }, 502);
        const hit = (await s.json())?.[0];
        if (!hit) return json6({ configured: true, found: false });
        const d = await fetch(`${API3}/properties/${encodeURIComponent(hit.id)}`, { headers: h, signal: AbortSignal.timeout(8e3) });
        const p = d.ok ? await d.json() : {};
        let estimate = null;
        try {
          const e = await fetch(`${API3}/properties/${encodeURIComponent(hit.id)}/priceEstimate`, { headers: h, signal: AbortSignal.timeout(8e3) });
          if (e.ok) {
            const x = await e.json();
            estimate = { low: x.lowerPrice ?? null, mid: x.midPrice ?? null, high: x.upperPrice ?? null, confidence: x.priceConfidence ?? null, date: x.date ?? null };
          }
        } catch {
        }
        const sales = (p.history?.sales || []).map((x) => ({ date: x.date, price: x.price ?? x.apmPrice ?? null, type: x.type || null })).filter((x) => x.price);
        return json6({
          configured: true,
          found: true,
          id: hit.id,
          address: hit.address,
          components: hit.addressComponents || null,
          type: p.propertyCategory || p.propertyType || null,
          beds: p.bedrooms ?? null,
          baths: p.bathrooms ?? null,
          cars: p.carSpaces ?? null,
          land: p.areaSize ?? p.landArea ?? null,
          built: p.yearBuilt ?? null,
          lat: p.addressCoordinate?.lat ?? null,
          lng: p.addressCoordinate?.lon ?? null,
          photo: p.photos?.[0]?.fullUrl || null,
          sales,
          estimate,
          url: `https://www.domain.com.au/property-profile/${encodeURIComponent(String(hit.address || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`,
          attribution: "Property data powered by Domain"
        });
      } catch (e) {
        return json6({ configured: true, error: String(e.message || e) }, 502);
      }
    }, "default");
  }
});
var onRequest9;
var init_property2 = __esm({
  "api/property.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_property();
    init_cf();
    onRequest9 = wrap(property_default);
  }
});
function toolBody(title2, description, t) {
  return `<article class="ssr"><h1>${esc(title2)}</h1><p>${esc(description)}</p><h2>How it works</h2><ol>${t.how.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>${t.example ? `<h2>Worked example</h2><p>${esc(t.example)}</p>` : ""}<h2>Questions</h2>${t.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}<p>General information, not financial advice.</p></article>`;
}
__name(toolBody, "toolBody");
function liveAdjust() {
}
__name(liveAdjust, "liveAdjust");
function buildIndex(sub, market, index = null) {
  const c = /* @__PURE__ */ __name2((k) => sub.cols.indexOf(k), "c");
  const rows = sub.rows.map((r) => {
    const o = {};
    sub.cols.forEach((k, i) => o[k] = r[i]);
    return o;
  });
  const bySlug = /* @__PURE__ */ new Map();
  const byPc = /* @__PURE__ */ new Map();
  const byLga = /* @__PURE__ */ new Map();
  for (const o of rows) {
    o.name = clean(o.n);
    liveAdjust(o, index, market);
    o.slug = `${o.s.toLowerCase()}/${slugify(o.name)}-${o.pc || o.id}`;
    const sc = {};
    let t = 0;
    let w = 0;
    for (const [k, wt] of Object.entries(W)) {
      const v = o[`sc_${k}`];
      if (v == null) continue;
      t += v * wt;
      w += wt;
    }
    const risk = o.rsk ?? 0;
    const raw = w ? t / w : null;
    const base = raw != null && !(o.conf === "high" || o.conf === "medium") ? 50 + (raw - 50) * 0.85 : raw;
    o.score = w ? Math.max(0, Math.round(base) - (risk > 15 ? Math.min(30, Math.round((risk - 15) * 0.45)) : 0)) : null;
    bySlug.set(o.slug, o);
    if (o.pc) (byPc.get(o.pc) || byPc.set(o.pc, []).get(o.pc)).push(o);
    if (o.lga) {
      const k = `${o.s.toLowerCase()}/${slugify(o.lga)}`;
      (byLga.get(k) || byLga.set(k, []).get(k)).push(o);
    }
  }
  return { rows, bySlug, byPc, byLga, market, count: rows.length };
}
__name(buildIndex, "buildIndex");
function nearest(ix, s, n = 8) {
  return ix.rows.filter((x) => x !== s && x.pop >= 500 && Math.abs(x.lat - s.lat) < 0.3 && Math.abs(x.lng - s.lng) < 0.3).map((x) => [(x.lat - s.lat) ** 2 + ((x.lng - s.lng) * Math.cos(s.lat * Math.PI / 180)) ** 2, x]).sort((a, b) => a[0] - b[0]).slice(0, n).map(([, x]) => x);
}
__name(nearest, "nearest");
function describe(pathname, search, ix, origin) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const canonical = `${origin}${path === "/" ? "/" : path}`;
  const base = { status: 200, canonical, robots: "index,follow", jsonld: [], body: null, image: `${origin}/assets/og.png` };
  if (!ROUTES.some((re) => re.test(path))) {
    return { ...base, status: 404, robots: "noindex", title: "Page not found", description: "This page does not exist on Ownaroo. Try the suburb explorer, the affordability calculator or the search box.", body: '<div class="empty"><h1>Page not found</h1><p>Try the <a href="/suburbs">suburb explorer</a> or search above.</p></div>' };
  }
  const q = new URLSearchParams(search);
  let m = path.match(/^\/suburb\/([a-z]+\/[a-z0-9-]+)$/);
  if (m) {
    const s = ix.bySlug.get(m[1]);
    if (!s) return { ...base, status: 404, robots: "noindex", title: "Suburb not found", description: "No Australian suburb matches this address.", body: '<div class="empty"><h1>Suburb not found</h1><p>Try the <a href="/suburbs">suburb explorer</a>.</p></div>' };
    const R = ix.market?.regions?.[s.rg] || {};
    const type = s.pt === "u" ? "unit" : "house";
    const price = s.pt === "u" ? s.u : s.h;
    const rent = s.pt === "u" ? s.ru : s.rh;
    const title3 = `${s.name} ${s.s} ${s.pc || ""}: house prices, rents, yield and suburb score`.replace(/\s+/g, " ");
    const description2 = `Typical ${type} in ${s.name} about ${money(price)}, rent about $${rent ?? "\u2014"} a week (${pct(s.y, 1)} yield). Price trend, demographics, supply, risks and the cost to buy, at the latest month-end.`;
    const near = nearest(ix, s);
    const lgaSlug = s.lga ? `${s.s.toLowerCase()}/${slugify(s.lga)}` : null;
    const body2 = `<article class="ssr"><div class="crumbs"><a href="/suburbs?state=${s.s}">${esc(STATE_NAMES[s.s] || s.s)}</a> \u203A ${lgaSlug ? `<a href="/council/${lgaSlug}">${esc(s.lga)}</a> \u203A ` : ""}${s.pc ? `<a href="/postcode/${s.pc}">${s.pc}</a>` : ""}</div>
<h1>${esc(s.name)} ${s.s} ${esc(s.pc || "")}</h1>
<p>${esc(s.name)} is in the ${esc(s.lga || "")} council area of ${esc(R.name || STATE_NAMES[s.s] || "")}, with about ${Number(s.pop).toLocaleString("en-AU")} residents. The typical house is about ${money(s.h)}${s.u ? ` and the typical unit or townhouse about ${money(s.u)}` : ""}. The typical house rent is about $${s.rh ?? "\u2014"} a week${s.ru ? ` ($${s.ru} for a unit)` : ""}${s.y ? `, a gross yield of about ${pct(s.y, 1)} on a house` : ""}. ${R.quarterPct != null ? `Over the last 3 months ${esc(R.name || "the area")} values changed ${pct(R.quarterPct, 1, true)} (${pct(R.annualPct, 1, true)} over 12 months, month-end ${esc(ix.market?.indexMonth || "")}).` : ""} Ownaroo suburb score: ${s.score ?? "\u2014"}/100.</p>
<ul><li>Price data: ${s.hs === "model" ? "modelled (no official suburb sales series)" : "official government sales"}</li><li>${s.cbd != null ? `${Math.round(s.cbd)} km from the city centre` : "Regional"}${s.ocn != null ? `, ${Number(s.ocn).toFixed(1)} km from the ocean` : ""}</li></ul>
<h2>Nearby suburbs</h2><ul>${near.map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)} ${x.s} ${esc(x.pc || "")}</a>: typical ${x.pt === "u" ? "unit" : "house"} ${money(x.pt === "u" ? x.u : x.h)}</li>`).join("")}</ul></article>`;
    const jsonld2 = [
      { "@context": "https://schema.org", "@type": "Place", name: `${s.name}, ${s.s} ${s.pc || ""}`.trim(), address: { "@type": "PostalAddress", addressLocality: s.name, addressRegion: s.s, postalCode: s.pc || void 0, addressCountry: "AU" }, geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng }, containedInPlace: s.lga ? { "@type": "AdministrativeArea", name: s.lga } : void 0 },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: STATE_NAMES[s.s] || s.s, item: `${origin}/suburbs?state=${s.s}` },
        ...lgaSlug ? [{ "@type": "ListItem", position: 2, name: s.lga, item: `${origin}/council/${lgaSlug}` }] : [],
        { "@type": "ListItem", position: lgaSlug ? 3 : 2, name: s.name, item: canonical }
      ] }
    ];
    const thin = s.hs === "model" && (Number(s.pop) || 0) < 3e3;
    return { ...base, title: title3, description: description2, body: body2, jsonld: jsonld2, robots: thin ? "noindex,follow" : base.robots };
  }
  m = path.match(/^\/postcode\/(\d{3,4})$/);
  if (m) {
    const list = (ix.byPc.get(m[1]) || []).sort((a, b) => b.pop - a.pop);
    if (!list.length) return { ...base, status: 404, robots: "noindex", title: "Postcode not found", description: "No suburbs found for this postcode.", body: '<div class="empty"><h1>Postcode not found</h1></div>' };
    const title3 = `Postcode ${m[1]}: suburbs, house prices and rents (${list[0].s})`;
    const description2 = `${list.length} suburb${list.length > 1 ? "s" : ""} in postcode ${m[1]}, ${STATE_NAMES[list[0].s]}: ${list.slice(0, 4).map((x) => x.name).join(", ")}. Typical prices, rents, yields and suburb scores.`;
    const body2 = `<article class="ssr"><h1>Postcode ${m[1]}</h1><ul>${list.map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)}</a>: typical house ${money(x.h)}, rent $${x.rh ?? "\u2014"}/wk, score ${x.score ?? "\u2014"}</li>`).join("")}</ul></article>`;
    return { ...base, title: title3, description: description2, body: body2 };
  }
  m = path.match(/^\/council\/([a-z]+\/[a-z0-9-]+)$/);
  if (m) {
    const key = m[1].replace(/-+$/, "");
    const short = key.replace(/(-(shire|regional|city|council|nsw|vic|qld|sa|wa|tas|nt|act))+$/, "");
    const list = (ix.byLga.get(key) || ix.byLga.get(short) || []).sort((a, b) => b.pop - a.pop);
    if (!list.length) return { ...base, status: 404, robots: "noindex", title: "Council not found", description: "No council area matches this address.", body: '<div class="empty"><h1>Council not found</h1></div>' };
    const lga = list[0].lga;
    const title3 = `${lga} council area: suburbs, house prices, rents and scores`;
    const description2 = `${list.length} suburbs in ${lga} (${list[0].s}), with typical prices, rents, yields and Ownaroo suburb scores.`;
    const body2 = `<article class="ssr"><h1>${esc(lga)}</h1><ul>${list.slice(0, 60).map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)} ${esc(x.pc || "")}</a>: typical house ${money(x.h)}, score ${x.score ?? "\u2014"}</li>`).join("")}</ul></article>`;
    return { ...base, title: title3, description: description2, body: body2 };
  }
  const page = PAGES[path] || PAGES[path.replace(/^\/listings$/, "/property")] || ["Ownaroo", PAGES["/"][1]];
  let [title2, description] = page;
  let robots = NOINDEX.has(path) || [...q.keys()].some((k) => ["q", "price", "savings", "income", "ids", "asking"].includes(k)) ? "noindex,follow" : "index,follow";
  if (path === "/listings") robots = "noindex,follow";
  const jsonld = path === "/" ? [
    { "@context": "https://schema.org", "@type": "Organization", name: "Ownaroo", url: `${origin}/`, email: "Keyzing18@gmail.com", logo: `${origin}/assets/ownaroo.svg`, address: { "@type": "PostalAddress", addressLocality: "Perth", addressRegion: "WA", addressCountry: "AU" } },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Ownaroo", url: `${origin}/`, potentialAction: { "@type": "SearchAction", target: `${origin}/find?q={search_term_string}`, "query-input": "required name=search_term_string" } }
  ] : [];
  const tool = TOOL[path];
  if (tool) jsonld.push(faqLd(tool));
  const body = path === "/" ? null : tool ? toolBody(title2, description, tool) : `<article class="ssr"><h1>${esc(title2)}</h1><p>${esc(description)}</p></article>`;
  return { ...base, title: title2, description, robots, jsonld, body, canonical: path === "/listings" ? `${origin}/property` : canonical };
}
__name(describe, "describe");
function renderHtml(html, meta) {
  const full = meta.title === "Ownaroo" ? "Ownaroo" : `${meta.title} \xB7 Ownaroo`;
  const tags = [
    `<link rel="canonical" href="${esc(meta.canonical)}">`,
    `<meta name="robots" content="${meta.robots}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Ownaroo">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${esc(meta.canonical)}">`,
    `<meta property="og:image" content="${esc(meta.image)}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="en_AU">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<meta name="twitter:image" content="${esc(meta.image)}">`,
    ...meta.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}<\/script>`)
  ].join("\n  ");
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(full)}</title>`).replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(meta.description)}" />`).replace("</head>", `  ${tags}
</head>`);
  if (meta.body) out = out.replace(/<main id="main" class="wrap">[\s\S]*?<\/main>/, `<main id="main" class="wrap">${meta.body}</main>`);
  return out;
}
__name(renderHtml, "renderHtml");
var clean;
var slugify;
var esc;
var money;
var pct;
var STATE_NAMES;
var W;
var PAGES;
var NOINDEX;
var TOOL;
var faqLd;
var GUIDE;
var ROUTES;
var init_seo_core = __esm({
  "../netlify/shared/seo-core.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    clean = /* @__PURE__ */ __name2((n) => n.replace(/\s*\((NSW|Vic\.|Qld|SA|WA|Tas\.|NT|ACT)\)\s*$/i, ""), "clean");
    slugify = /* @__PURE__ */ __name2((x) => x.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), "slugify");
    esc = /* @__PURE__ */ __name2((s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "esc");
    money = /* @__PURE__ */ __name2((v) => v == null ? "\u2014" : v >= 999500 ? `$${(v / 1e6).toFixed(2)}m` : `$${Math.round(v / 1e3)}k`, "money");
    pct = /* @__PURE__ */ __name2((v, dp = 1, sign = false) => v == null ? "\u2014" : `${sign && v > 0 ? "+" : ""}${Number(v).toFixed(dp)}%`, "pct");
    STATE_NAMES = { NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland", WA: "Western Australia", SA: "South Australia", TAS: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory" };
    W = { cash: 22, momentum: 0, growth: 25, demand: 23, afford: 12, stability: 18 };
    PAGES = {
      "/": ["What can you comfortably afford, and where?", "Free and independent for Australian home buyers: a comfortable price where you want to buy, the schemes you qualify for (5% Deposit Scheme, Help to Buy, Keystart and state schemes), the real weekly cost of an investment under the 2026 tax rules, and advertised rates from 90+ lenders."],
      "/afford": ["What can I afford? A comfortable price, and your ceiling in every state", "Enter your savings and income. Ownaroo works out a comfortable price where you want to buy, the most you could stretch to in every state and territory (stamp duty, mortgage insurance, lender buffers), the schemes you qualify for and the suburbs that fit."],
      "/property": ["Price range for a typical home", "A suburb-based price range for a typical home like the one you\u2019re looking at, the cash you need and the repayments. Not an appraisal of a particular property."],
      "/find": ["Search property by what you want", 'Describe what you want in plain English, like "3 bed house near the beach in Perth under $800k", and Ownaroo ranks every matching suburb.'],
      "/map": ["Highest-scoring suburbs in Australia: map", "Suburbs scored on yield, growth drivers, rental demand, affordability and stability, ranked within each state, on one map, with how much of each score is measured."],
      "/suburbs": ["Suburb explorer: rank every Australian suburb", "Filter and rank Australian suburbs within each state by price, rent, yield, growth drivers, demand and risk, with every figure marked as measured or modelled."],
      "/analyse": ["2026 tax-change investment property calculator", "The weekly cost after tax and 10-year return of an Australian investment property under the 2026 negative gearing and CGT changes, with stamp duty, LMI, land tax and depreciation, and whether it beats a term deposit."],
      "/borrowing": ["How much can I borrow?", "Estimate your borrowing power the way Australian lenders do, for a home to live in or an investment: the 3-point rate buffer, living costs, existing debts and 80% of any rent."],
      "/rates": ["Home loan rates in Australia, updated several times a day", "Advertised home loan rates from 90+ Australian lenders, read from their Open Banking feeds, with offset accounts and fees, ranked by loan type and deposit."],
      "/markets": ["Australian housing market update", "Which way prices are moving in each capital, the RBA cash rate, rates week by week, and the housing headlines that matter for your numbers."],
      "/new-builds": ["New homes and apartments: building approvals and new-build investing", "Monthly building approvals by state, council and area, and where new supply is heaviest."],
      "/guide": ["How to buy property in Australia: first home and investment (2026 guide)", "The whole process in order for first home buyers and investors: federal and state schemes including Keystart, stamp duty by state, finance, the 2026 tax changes and every cost."],
      "/first-home": ["First home tools: rent vs buy, savings planner, FHSS calculator", "How long it will take to save a deposit, whether buying beats renting, and how much the First Home Super Saver scheme adds."],
      "/compare": ["Compare suburbs side by side", "Compare up to four Australian suburbs on price, rent, yield, growth and risk."],
      "/watchlist": ["Your watchlist and saved deals", "Suburbs and deals you have saved on Ownaroo, kept only in your own browser."],
      "/methodology": ["Data sources and methodology", "Where every Ownaroo figure comes from, how the price and rent models work, and their measured error."],
      "/about": ["About Ownaroo", "What Ownaroo does for home buyers and investors, who runs it, where its numbers come from and how it stays independent."],
      "/contact": ["Contact Ownaroo", "Contact Ownaroo with a question, a data correction or a privacy request. Every message gets a reply by email."],
      "/price-check": ["Listing price check: which first home buyers a price shuts out", "Enter a listing price and suburb. See which first home buyer schemes, grants and stamp duty concessions still apply at that price, and the nearest price that brings buyers back."],
      "/privacy": ["Privacy policy", "What Ownaroo collects, why, and what it does with it."],
      "/terms": ["Terms of use", "The terms for using Ownaroo: general information and calculators, not financial, credit, tax or legal advice, and how estimates and third-party data should be used."]
    };
    NOINDEX = /* @__PURE__ */ new Set(["/compare", "/watchlist"]);
    TOOL = {
      "/afford": {
        how: ["Choose where you want to buy, then enter your savings and before-tax income.", "Ownaroo finds a comfortable price: repayments within 30% of before-tax household income, with your savings covering the deposit, stamp duty and fees.", "It also shows the most a lender might stretch to (tested at your rate plus 3 points), the schemes you qualify for and the suburbs where a typical home fits."],
        example: "Example (September 2026 rates): a first home buyer couple in Perth with $110,000 saved and $155,000 combined income. A comfortable price is about $720,000, needing about $110,000 in cash with repayments of about $894 a week; a lender might stretch to about $735,000.",
        faq: [["What is a comfortable price?", "The price at which repayments stay within 30% of your before-tax household income, a common measure of mortgage stress, and your savings cover the deposit, stamp duty and fees."], ["Why is the most I could borrow different?", "Lenders test whether you could still pay at your rate plus 3 percentage points, after living costs and debts. That limit is often higher than a comfortable price."], ["Does it include first home schemes?", "Yes: the 5% Deposit Scheme, Help to Buy, Keystart in WA and state first home concessions, with the price caps where you want to buy."]]
      },
      "/analyse": {
        how: ["Enter the price, rent, deposit, rate and your income, or pick a suburb to fill them in.", "Ownaroo works out stamp duty, LMI, land tax and running costs, then projects ten years of cash flow, tax and the sale.", "It applies the 2026 rules: for established homes bought from 12 May 2026, rental losses stop reducing salary tax from 1 July 2027, and gains after that date are indexed with a 30% minimum tax. New builds keep negative gearing and can choose either CGT method."],
        example: "Example (September 2026): an $850,000 NSW house renting at $650 a week, bought with a 20% deposit at 6.40% on a $120,000 salary, costs about $480 a week after tax in year one, with about $205,000 needed up front.",
        faq: [["Does negative gearing still apply?", "For established homes contracted from 12 May 2026, losses offset salary only until 30 June 2027, then carry forward against rental profits and the eventual gain. New builds and earlier contracts keep it."], ["New build or established?", "The calculator runs the same deal both ways side by side: weekly cost, tax refunds, capital gains tax and the after-tax return."], ["What return does it show?", "The annual after-tax return on the cash you put in (IRR), at 1%, 3% and 5% a year price growth, next to a cash-rate deposit and paying down your own home loan."]]
      },
      "/rates": {
        how: ["Every Australian bank publishes its home loans in a standard Open Banking (Consumer Data Right) feed.", "Ownaroo reads those feeds several times a day and ranks the rates by loan type, repayment type and deposit.", 'Rates from credit unions and regional lenders with membership or area rules are marked "Check eligibility", so the headline figures are ones anyone can apply for.'],
        faq: [["Are these the rates I will get?", "They are advertised rates. Lenders may offer less to strong applicants, and the rate depends on your deposit, loan size and purpose."], ["What is a comparison rate?", "The rate with most fees built in, for a $150,000 loan over 25 years. Useful for comparing, but not the exact cost of your loan."]]
      },
      "/borrowing": {
        how: ["Enter your income, debts, card limits, dependants and any HECS debt.", "Ownaroo tests repayments at your rate plus 3 points, after tax and living costs, counting 80% of any rent, the way lenders do.", "If you already own property, it counts that loan and shows the equity you could borrow against for the next deposit."],
        faq: [["Why do lenders add 3%?", "The banking regulator expects lenders to check you could still pay if rates rose by 3 percentage points."], ["Do credit card limits count?", "Yes. Lenders count about 3% of the limit each month, even if the card is paid off."]]
      },
      "/property": {
        how: ["Type an address or suburb.", "Ownaroo shows a price range for a typical home of that kind in the suburb, the cash needed and the repayments, plus local risks and hazard map links.", "It is a suburb-based range, not an appraisal of a particular home."],
        faq: [["Is this a valuation?", "No. It is a range for a typical home in the suburb. Only an inspection by a valuer can value a particular property."]]
      },
      "/first-home": {
        how: ["See how long it takes to save a deposit at your savings rate.", "Compare buying with renting over the years you expect to stay.", "Work out how much the First Home Super Saver scheme adds to your deposit."],
        faq: [["What is the First Home Super Saver scheme?", "You can make voluntary super contributions and later withdraw up to $50,000 of them, with earnings, for a first home deposit, taxed at a discount."]]
      },
      "/price-check": {
        how: ["Enter a listing price and suburb.", "Ownaroo shows which first home buyer schemes, grants and duty concessions still apply at that price, and the prices that bring buyers back.", 'It makes a "Can you afford this home?" link and QR code for the listing.'],
        example: "Example: in Perth the 5% Deposit Scheme and Help to Buy caps are both $850,000 and Keystart stops at $860,000, so a home listed at $869,000 loses every first home buyer relying on them.",
        faq: [["Why do price caps matter to sellers?", "Buyers using a government scheme cannot buy above its cap for the area, so a price just over it removes them from the market."]]
      }
    };
    __name2(toolBody, "toolBody");
    faqLd = /* @__PURE__ */ __name2((t) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }), "faqLd");
    __name2(liveAdjust, "liveAdjust");
    __name2(buildIndex, "buildIndex");
    GUIDE = [["before", "Before you buy: goals, budget and timing", "What to decide before you look at a single property: why you are buying, what you can hold through a rate rise, and your timeline."], ["fhb", "Buying your first home in Australia (2026)", "The 5% Deposit Scheme, Help to Buy, first home grants, stamp duty concessions and state home lenders like Keystart, and each step to settlement."], ["strategy", "Property investment strategies: growth, yield or new builds", "Capital growth, cash flow and new builds under the 2026 tax rules: what each strategy needs and who it suits."], ["finance", "Getting your home loan ready", "Pre-approval, deposit, lenders mortgage insurance, the 3-point serviceability buffer and the documents lenders ask for."], ["research", "How to research a suburb before you buy", "Prices, rents, vacancy, supply, local economy and hazards: what to check about a suburb and where to find it."], ["buy", "Finding, inspecting and buying a property", "Inspections, building and pest reports, making an offer, auctions and exchanging contracts."], ["settle", "Property settlement in Australia", "What happens between exchange and settlement, and what to check on the day."], ["own", "Owning an investment property", "Tenants, property managers, insurance, depreciation and records for tax time."], ["costs", "Every cost of buying property, in one place", "Deposit, stamp duty, LMI, legal and inspection fees, and the ongoing costs of owning."], ["duty", "Stamp duty in every state and territory (2026)", "Stamp duty at common prices in each state and territory, with first home and owner-occupier concessions."], ["landtax", "Land tax by state (2026)", "Land tax thresholds and rates for investors in each state and territory."], ["tax-2026", "The 2026 negative gearing and CGT changes, explained", "Who keeps negative gearing, how capital gains are taxed from 1 July 2027, and what it means for your weekly cost and return."], ["mistakes", "Common property buying mistakes", "The mistakes that cost buyers most, and how to avoid them."], ["glossary", "Property and home loan glossary", "Plain-English definitions of LVR, LMI, comparison rates, offset accounts and more."], ["faq", "Property buying questions, answered", "Short answers to the questions buyers ask most."]];
    for (const [id, t, d] of GUIDE) PAGES[`/guide/${id}`] = [t, d];
    ROUTES = [
      /^\/$/,
      /^\/markets$/,
      /^\/new-builds$/,
      /^\/weekly$/,
      /^\/suburbs$/,
      /^\/suburb\/[a-z]+\/[a-z0-9-]+$/,
      /^\/postcode\/\d{3,4}$/,
      /^\/council\/[a-z]+\/[a-z0-9-]+$/,
      /^\/analyse$/,
      /^\/afford$/,
      /^\/rates$/,
      /^\/listings$/,
      /^\/news$/,
      /^\/guide$/,
      /^\/guide\/[a-z0-9-]+$/,
      /^\/compare$/,
      /^\/watchlist$/,
      /^\/borrowing$/,
      /^\/methodology$/,
      /^\/find$/,
      /^\/property$/,
      /^\/map$/,
      /^\/(about|privacy|terms|contact)$/,
      /^\/first-home$/,
      /^\/why$/,
      /^\/price-check$/
    ];
    __name2(nearest, "nearest");
    __name2(describe, "describe");
    __name2(renderHtml, "renderHtml");
  }
});
async function cached(key, load) {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}
__name(cached, "cached");
function statesFor(path) {
  let m = path.match(/^\/(?:suburb|council)\/([a-z]+)\//);
  if (m) return [m[1].toUpperCase()];
  m = path.match(/^\/postcode\/(\d{3,4})\/?$/);
  if (m) {
    const pc = +m[1];
    if (pc < 1e3) return ["NT"];
    if (pc < 3e3) return ["NSW", "ACT"];
    if (pc < 4e3 || pc >= 8e3 && pc < 9e3) return ["VIC"];
    if (pc < 5e3 || pc >= 9e3) return ["QLD"];
    if (pc < 6e3) return ["SA"];
    if (pc < 7e3) return ["WA"];
    return ["TAS"];
  }
  return [];
}
__name(statesFor, "statesFor");
async function onRequest10(ctx) {
  const { request, env: env2, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (MOVED[path]) return Response.redirect(new URL(MOVED[path], url.origin).href, 301);
  if (request.method !== "GET" && request.method !== "HEAD" || path.startsWith("/api/")) return next();
  const res = await next();
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
  try {
    const asset = /* @__PURE__ */ __name2((p) => env2.ASSETS.fetch(new URL(p, url.origin)).then((r) => r.ok ? r.json() : null), "asset");
    const states = statesFor(url.pathname).filter((s) => /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/.test(s));
    const market = await cached("market", () => asset("/data/market.json"));
    const ix = await cached(`ix:${states.join(",")}`, async () => {
      const parts = (await Promise.all(states.map((s) => asset(`/data/seo/${s}.json`)))).filter(Boolean);
      const sub = { cols: parts[0]?.cols || ["id", "n", "s"], rows: parts.flatMap((p) => p.rows) };
      return buildIndex(sub, market, null);
    });
    const origin = (env2.SITE_URL || url.origin).replace(/\/$/, "").replace(/^http:\/\//, "https://");
    const meta = describe(url.pathname, url.search, ix, origin);
    const html = renderHtml(await res.text(), meta);
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    return new Response(request.method === "HEAD" ? null : html, { status: meta.status, headers });
  } catch (e) {
    console.error("seo middleware", e);
    return res;
  }
}
__name(onRequest10, "onRequest10");
var MOVED;
var cache;
var TTL;
var init_middleware = __esm({
  "_middleware.js"() {
    init_functionsRoutes_0_9135008863380318();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_seo_core();
    MOVED = { "/why": "/about", "/news": "/markets#news", "/weekly": "/markets#weekly", "/live": "/markets", "/listings": "/property" };
    cache = /* @__PURE__ */ new Map();
    TTL = 30 * 60 * 1e3;
    __name2(cached, "cached");
    __name2(statesFor, "statesFor");
    __name2(onRequest10, "onRequest");
  }
});
var routes;
var init_functionsRoutes_0_9135008863380318 = __esm({
  "../.wrangler/tmp/pages-r3fdTS/functionsRoutes-0.9135008863380318.mjs"() {
    init_config2();
    init_contact2();
    init_geocode2();
    init_hit2();
    init_listings2();
    init_live_news();
    init_live_rba();
    init_photos2();
    init_property2();
    init_middleware();
    routes = [
      {
        routePath: "/api/config",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest]
      },
      {
        routePath: "/api/contact",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest2]
      },
      {
        routePath: "/api/geocode",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest3]
      },
      {
        routePath: "/api/hit",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest4]
      },
      {
        routePath: "/api/listings",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest5]
      },
      {
        routePath: "/api/live-news",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest6]
      },
      {
        routePath: "/api/live-rba",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest7]
      },
      {
        routePath: "/api/photos",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest8]
      },
      {
        routePath: "/api/property",
        mountPath: "/api",
        method: "",
        middlewares: [],
        modules: [onRequest9]
      },
      {
        routePath: "/",
        mountPath: "/",
        method: "",
        middlewares: [onRequest10],
        modules: []
      }
    ];
  }
});
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open2 = tryConsume("OPEN");
    if (open2) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode2 = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode2(value, key);
        });
      } else {
        params[key.name] = decode2(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    const body = JSON.stringify(error3);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
init_functionsRoutes_0_9135008863380318();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/templates/pages-dev-util.ts
function isRoutingRuleMatch(pathname, routingRule) {
  if (!pathname) {
    throw new Error("Pathname is undefined.");
  }
  if (!routingRule) {
    throw new Error("Routing rule is undefined.");
  }
  const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
  return pathname.match(ruleRegExp) !== null;
}
__name(isRoutingRuleMatch, "isRoutingRuleMatch");
function transformRoutingRuleToRegExp(rule) {
  let transformedRule;
  if (rule === "/" || rule === "/*") {
    transformedRule = rule;
  } else if (rule.endsWith("/*")) {
    transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
  } else if (rule.endsWith("/")) {
    transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
  } else if (rule.endsWith("*")) {
    transformedRule = rule;
  } else {
    transformedRule = `${rule}(/)?`;
  }
  transformedRule = `^${transformedRule.replaceAll(/\./g, "\\.").replaceAll(/\*/g, ".*")}$`;
  return new RegExp(transformedRule);
}
__name(transformRoutingRuleToRegExp, "transformRoutingRuleToRegExp");

// .wrangler/tmp/pages-r3fdTS/py3oebjaanp.js
var define_ROUTES_default = {
  version: 1,
  include: ["/*"],
  exclude: ["/assets/*", "/data/*", "/sitemap.xml", "/robots.txt", "/favicon.ico"]
};
var routes2 = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env2, context2) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes2.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env2.ASSETS.fetch(request);
      }
    }
    for (const include of routes2.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = middleware_loader_entry_default;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env2, context2);
      }
    }
    return env2.ASSETS.fetch(request);
  }
};

// ../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError2(e);
    const body = JSON.stringify(error3);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-1fAa7q/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = pages_dev_pipeline_default;

// ../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env2, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-1fAa7q/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=py3oebjaanp.js.map
