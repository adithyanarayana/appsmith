import RealmExecutor from "./RealmExecutor";
import moment from "moment-timezone";
import { ActionDescription } from "entities/DataTree/dataTreeFactory";
import { btoa, atob, version as BASE64LIBVERSION } from "js-base64";
import { VERSION as lodashVersion } from "lodash";
export type JSExecutorGlobal = Record<string, object>;
export type JSExecutorResult = {
  result: any;
  triggers?: ActionDescription<any>[];
};
export interface JSExecutor {
  execute: (
    src: string,
    data: JSExecutorGlobal,
    callbackData?: any,
  ) => JSExecutorResult;
  registerLibrary: (accessor: string, lib: any) => void;
  unRegisterLibrary: (accessor: string) => void;
}

enum JSExecutorType {
  REALM,
}

export type ExtraLibrary = {
  version: string;
  docsURL: string;
  displayName: string;
  accessor: string;
  lib: any;
};

export const extraLibraries: ExtraLibrary[] = [
  {
    accessor: "_",
    lib: window._,
    version: lodashVersion,
    docsURL: `https://lodash.com/docs/${lodashVersion}`,
    displayName: "lodash",
  },
  {
    accessor: "moment",
    lib: moment,
    version: moment.version,
    docsURL: `https://momentjs.com/docs/`,
    displayName: "moment",
  },
  {
    accessor: "btoa",
    lib: btoa,
    version: BASE64LIBVERSION,
    docsURL: "https://github.com/dankogai/js-base64#readme",
    displayName: "btoa",
  },
  {
    accessor: "atob",
    lib: atob,
    version: BASE64LIBVERSION,
    docsURL: "https://github.com/dankogai/js-base64#readme",
    displayName: "atob",
  },
];

class JSExecutionManager {
  currentExecutor: JSExecutor;
  executors: Record<JSExecutorType, JSExecutor>;
  registerLibrary(accessor: string, lib: any) {
    Object.keys(this.executors).forEach(type => {
      const executor = this.executors[(type as any) as JSExecutorType];
      executor.registerLibrary(accessor, lib);
    });
  }
  unRegisterLibrary(accessor: string) {
    Object.keys(this.executors).forEach(type => {
      const executor = this.executors[(type as any) as JSExecutorType];
      executor.unRegisterLibrary(accessor);
    });
  }
  switchExecutor(type: JSExecutorType) {
    const executor = this.executors[type];
    if (!executor) {
      throw new Error("Executor does not exist");
    }
    this.currentExecutor = executor;
  }
  constructor() {
    const realmExecutor = new RealmExecutor();
    this.executors = {
      [JSExecutorType.REALM]: realmExecutor,
    };
    this.currentExecutor = realmExecutor;

    extraLibraries.forEach(config => {
      this.registerLibrary(config.accessor, config.lib);
    });
  }
  evaluateSync(
    jsSrc: string,
    data: JSExecutorGlobal,
    callbackData?: any,
  ): JSExecutorResult {
    return this.currentExecutor.execute(jsSrc, data, callbackData);
  }
}
const JSExecutionManagerSingleton = new JSExecutionManager();

export default JSExecutionManagerSingleton;
