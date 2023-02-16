import {PlatformContext} from "@tsed/common";
import {PlatformKitStarterSettings} from "./PlatformKitStarterSettings";

declare global {
  namespace TsED {
    export interface Application {}

    export interface Configuration {
      /**
       * Configuration related to the platform application.
       */
      kitStarter: PlatformKitStarterSettings;
    }

    export interface NextFunction {}

    export interface Response {}
    export interface Request {
      id: string;
      $ctx: PlatformContext;
    }

    export interface StaticsOptions {}
  }
}
