import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { Router } from "./Router.js";
import { RouteRegistry } from "./RouteRegistry.js";
import { QueryStringParser } from "@workspace/domain/services/QueryStringParser";

describe("Router Properties", () => {
  let router;
  let historyAdapter;
  let linkInterceptor;
  let renderer;
  let registry;

  beforeEach(() => {
    let currentUrl = "/";
    historyAdapter = {
      pushState: vi.fn((state, title, url) => {
        currentUrl = url;
      }),
      back: vi.fn(),
      forward: vi.fn(),
      getPathname: vi.fn(() => currentUrl),
      getSearch: vi.fn().mockReturnValue(""),
      onPopState: vi.fn(),
    };
    linkInterceptor = { intercept: vi.fn(), destroy: vi.fn() };
    renderer = { render: vi.fn(), renderNotFound: vi.fn() };
    registry = new RouteRegistry();

    router = new Router({
      historyAdapter,
      linkInterceptor,
      renderer,
      registry,
    });
  });

  it("Property 1: Navigation Updates URL Without Reload", async () => {
    await fc.assert(
      fc.asyncProperty(fc.webUrl(), async (url) => {
        historyAdapter.pushState.mockClear();
        QueryStringParser.parsePath(url); // We don't use pathname and search here
        historyAdapter.pushState({}, "", "/");
        historyAdapter.pushState.mockClear();

        await router.navigate(url);

        expect(historyAdapter.pushState).toHaveBeenCalledWith({}, "", url);
      }),
    );
  });

  it("Property 3: Dynamic Route Parameters Extraction", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
        async (id) => {
          registry.add({ path: "/projects/:id", component: "ProjectDetail" });
          historyAdapter.pushState({}, "", `/projects/${id}`);

          await router.handleCurrentRoute();

          expect(renderer.render).toHaveBeenCalledWith(
            expect.objectContaining({ component: "ProjectDetail" }),
            expect.objectContaining({ params: { id } }),
          );
        },
      ),
    );
  });
});
