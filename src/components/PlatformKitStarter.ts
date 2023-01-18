import {
  createContext,
  InjectorService,
  PlatformAdapter,
  PlatformApplication,
  PlatformBuilder,
  PlatformHandlerType,
  PlatformMulter,
  PlatformMulterSettings,
  PlatformProvider,
  PlatformStaticsOptions,
  runInContext
} from "@tsed/common";
import {Type} from "@tsed/core";
import {PlatformHandlerMetadata, PlatformLayer} from "@tsed/platform-router";
import {staticsMiddleware} from "../middlewares/staticsMiddleware";
import {multerMiddleware} from "../middlewares/multerMiddleware";

export type Application = any

// to be removed and replaced by the web framework class like (Express, Koa, etc...)
function Raw() {
}

/**
 * @platform
 */

@PlatformProvider()
export class PlatformKitStarter implements PlatformAdapter<Application> {
  readonly providers = [];

  constructor(protected injector: InjectorService) {
  }

  /**
   * Create new serverless application. In this mode, the component scan are disabled.
   * @param module
   * @param settings
   */
  static create(module: Type<any>, settings: Partial<TsED.Configuration> = {}) {
    return PlatformBuilder.create<Express.Application>(module, {
      ...settings,
      adapter: PlatformKitStarter
    });
  }

  /**
   * Bootstrap a server application
   * @param module
   * @param settings
   */
  static async bootstrap(module: Type<any>, settings: Partial<TsED.Configuration> = {}) {
    return PlatformBuilder.bootstrap<Application>(module, {
      ...settings,
      adapter: PlatformKitStarter
    });
  }

  app() {
    const app = this.injector.settings.get("kitStarter.app") || Raw();

    return {
      app,
      callback: () => app
    };
  }

  /**
   * Install middlewares or set configuration the framework application before loading any Ts.ED controllers
   */
  async beforeLoadRoutes() {
    // const injector = this.injector;
    // const app = this.getPlatformApplication();
  }

  /**
   * Install middlewares to handle Exceptions or manage Not found exceptions
   */
  async afterLoadRoutes() {
    // const app = this.getPlatformApplication();
    // const platformExceptions = this.injector.get<PlatformExceptions>(PlatformExceptions)!;

    // NOT FOUND
    // app.use((req: any, res: any, next: any) => {
    //   const {$ctx} = req;
    //   !$ctx.isDone() && platformExceptions?.resourceNotFound(req.$ctx);
    // });

    // EXCEPTION FILTERS
    // app.use((err: any, req: any, res: any, next: any) => {
    //   const {$ctx} = req;
    //   !$ctx.isDone() && platformExceptions?.catch(err, $ctx);
    // });
  }

  /**
   * Map Ts.ED layers to the framework router
   * @param layers
   */
  mapLayers(layers: PlatformLayer[]) {
    const app = this.getPlatformApplication();
    const rawApp: any = app.getApp();

    layers.forEach((layer) => {
      switch (layer.method) {
        case "statics":
          rawApp.use(layer.path, this.statics(layer.path as string, layer.opts as any));
          return;
      }

      rawApp[layer.method](...layer.getArgs());
    });
  }

  /**
   * Transform  Ts.ED handler to the framework handler.
   * @param handler
   * @param metadata
   */
  mapHandler(handler: Function, metadata: PlatformHandlerMetadata) {
    switch (metadata.type) {
      case PlatformHandlerType.RAW_FN:
      case PlatformHandlerType.RAW_ERR_FN:
        return handler;
      case PlatformHandlerType.ERR_MIDDLEWARE:
        return async (error: unknown, req: any, res: any, next: any) => {
          return runInContext(req.$ctx, () => {
            const {$ctx} = req;

            $ctx.next = next;
            $ctx.error = error;

            return handler($ctx);
          });
        };
      default:
        return (req: any, res: any, next: any) => {
          return runInContext(req.$ctx, () => {
            req.$ctx.next = next;
            handler(req.$ctx);
          });
        };
    }
  }

  /**
   * Bind Ts.ED context to application. Context is mandatory and
   * must call `$ctx.start()` before next middleware and `$ctx.finish()` after all called middlewares to clean context.
   *
   * You have to wrap next handler by calling `runInContext($ctx, next)`.
   *
   * The implementation depend totally on the framework middleware implementation!
   */
  useContext(): this {
    const app = this.getPlatformApplication();
    const invoke = createContext(this.injector);

    this.injector.logger.debug("Mount app context");

    app.use(async (request: any, response: any, next: any) => {
      const $ctx = await invoke({request, response});
      await $ctx.start();

      $ctx.response.getRes().on("finish", () => $ctx.finish());

      return runInContext($ctx, next);
    });

    return this;
  }

  multipart(options: PlatformMulterSettings): PlatformMulter {
    return multerMiddleware(options);
  }

  statics(endpoint: string, options: PlatformStaticsOptions) {
    const {root, ...props} = options;

    return staticsMiddleware(root, props);
  }

  bodyParser(type: "json" | "text" | "urlencoded", additionalOptions: any = {}): any {

    return null;
  }

  getPlatformApplication() {
    return this.injector.get<PlatformApplication<Application>>(PlatformApplication)!;
  }
}
