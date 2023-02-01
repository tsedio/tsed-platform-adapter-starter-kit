import {PlatformKitStarter} from "./PlatformKitStarter";
import {getContext, PlatformContext, PlatformTest} from "@tsed/common";

class Server {
}

describe("PlatformKitStarter", () => {
  describe("create()", () => {
    it("should create platform", () => {
      const platform = PlatformKitStarter.create(Server, {});

      expect(platform.adapter).toBeInstanceOf(PlatformKitStarter);
    });
  });
  describe("bodyParser()", () => {
    beforeEach(() => jest.resetAllMocks());
    it("should return the body parser (json) ", () => {
      const stub = jest.fn().mockReturnValue("body");

      const platform = PlatformKitStarter.create(Server, {
        express: {
          bodyParser: {
            json: stub
          }
        }
      });

      const result = platform.adapter.bodyParser("json", {strict: true});

      expect(result).toEqual("body");
      expect(stub).toBeCalledWith({strict: true, verify: expect.any(Function)});
    });
    it("should return the body parser (urlencoded) ", () => {
      const stub = jest.fn().mockReturnValue("body");

      const platform = PlatformKitStarter.create(Server, {
        kitStarter: {
          bodyParser: {
            urlencoded: stub
          }
        }
      });

      const result = platform.adapter.bodyParser("urlencoded", {strict: true});

      expect(result).toEqual("body");
      expect(stub).toBeCalledWith({extended: true, strict: true, verify: expect.any(Function)});
    });
  });
  describe("app()", () => {
    it("should return an object with callback function and orignal app from given configuration", () => {
      const App = jest.fn();

      const platform = PlatformKitStarter.create(Server, {
        kitStarter: {
          app: App
        }
      });

      const result = platform.adapter.app();

      expect(result.app).toEqual(App);
      expect(result.callback).toBe("function");
    });
    it("should return an object with callback function and orignal app from default configuration", () => {
      const platform = PlatformKitStarter.create(Server, {});

      const result = platform.adapter.app();

      expect(result.app).toBe("function");
      expect(result.callback).toBe("function");
    });
  });
  xdescribe("useContext()", () => {
    it("should add context and handler can access to $ctx", () => {
      const platform = PlatformKitStarter.create(Server, {});
      const app = {
        use: jest.fn()
      };

      jest.spyOn(platform.adapter as any, "getPlatformApplication").mockReturnValue(app);

      platform.adapter.useContext();

      expect(app.use).toHaveBeenCalledWith(expect.any(Function));

      const request = PlatformTest.createRequest();
      const response = PlatformTest.createResponse();

      response.on = jest.fn()

      app.use.mock.calls[0][0](request, response, () => {
        const ctx = getContext();
        expect(ctx).toBeInstanceOf(PlatformContext);
      });
    });
  });
});
