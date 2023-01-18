import "@tsed/ajv";
import {Constant, PlatformApplication} from "@tsed/common";
import {Configuration, Inject} from "@tsed/di";
import {Application} from "express";
import "../../src";

export const rootDir = __dirname;

@Configuration({
  port: 8081,
  logger: {
    level: "info"
  },
  statics: {
    "/": `${rootDir}/public`
  },
  views: {
    root: `${rootDir}/views`,
    extensions: {
      ejs: "ejs"
    }
  },
  middlewares: [
    "cookie-parser",
    "compress",
    "method-override",
    {use: "json-parser"},
    {use: "urlencoded-parser"},
    {
      use: "session", options: {
        secret: "keyboard cat", // change secret key
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: false // set true if HTTPS is enabled
        }
      }
    }
  ]
})
export class Server {
  @Inject()
  app: PlatformApplication<Application>;

  @Constant("viewsDir")
  viewsDir: string;
}
