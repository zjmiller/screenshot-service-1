import { Request, Response } from "express";
import { Browser, chromium } from "playwright";
import { getRedisClient } from "./getRedisClient.js";

let localBrowser: Browser | null = null;
let localBrowserContextsInUse = 0;

export async function screenshotHandler(request: Request, response: Response) {
  let isUsingLocalBrowser = false;

  const { elementId, url } = request.body;

  if (!elementId || !url) {
    return response
      .status(400)
      .json({ error: "Element ID and URL are required" });
  }

  const parsedUrl = new URL(url);
  const screenshotCacheKey = `screenshot:${parsedUrl.pathname}${parsedUrl.search}:${elementId}`;
  const accessibilityCacheKey = `accessibility:${parsedUrl.pathname}${parsedUrl.search}:${elementId}`;
  const redis = await getRedisClient();
  const cachedScreenshot = await redis.get(screenshotCacheKey);
  const cachedAccessibilityTree = await redis.get(accessibilityCacheKey);

  if (cachedScreenshot && cachedAccessibilityTree) {
    return response.json({
      screenshot: cachedScreenshot,
      accessibilityTree: cachedAccessibilityTree,
    });
  }

  let screenshot;
  let accessibilityTree;

  let browser: Browser | null = null;

  try {
    if (!localBrowser || !localBrowser.isConnected()) {
      localBrowser = await chromium.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
      });
    }

    if (localBrowserContextsInUse <= 3) {
      console.log("Using local browser");
      browser = localBrowser;
      isUsingLocalBrowser = true;
      localBrowserContextsInUse++;
    } else {
      console.log("Using browserless");
      browser = await chromium.connect(
        `wss://production-sfo.browserless.io/chromium/playwright?token=${process.env.BROWSERLESS_API_TOKEN}`
      );
    }

    const result = await useBrowser(
      browser,
      url,
      elementId,
      !!cachedScreenshot,
      !!cachedAccessibilityTree
    );
    screenshot = result.screenshot;
    accessibilityTree = result.accessibilityTree;
  } catch (error) {
    console.error("Error in screenshotHandler:", error);
    // on error, close the browser
    if (browser) {
      await browser.close();
    }

    // on error, if local browser, not only close it, but also set it to null
    if (isUsingLocalBrowser) {
      localBrowser = null;
      localBrowserContextsInUse = 0;
    }

    return response.status(500).json({
      error: "Failed to take screenshot or get accessibility tree",
      details: (error as Error).message,
    });
  }

  if (isUsingLocalBrowser) {
    localBrowserContextsInUse--;
  } else {
    // close browserless
    await browser.close();
  }

  if (!cachedScreenshot && screenshot) {
    redis.set(screenshotCacheKey, screenshot);
  }

  if (!cachedAccessibilityTree && accessibilityTree) {
    redis.set(accessibilityCacheKey, accessibilityTree);
  }

  return response.json({
    screenshot,
    accessibilityTree,
  });
}

async function useBrowser(
  browser: Browser,
  url: string,
  elementId: string,
  hasCachedScreenshot: boolean,
  hasCachedAccessibilityTree: boolean
) {
  let screenshot: string | undefined;
  let accessibilityTree: string | undefined;

  const context = await browser.newContext({
    viewport: { width: 1580, height: 1080 },
  });

  const page = await context.newPage();

  const urlWithHeadless = new URL(url);
  urlWithHeadless.searchParams.set("headless", "true");

  await page.goto(urlWithHeadless.toString(), {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  try {
    await page.waitForSelector(`#${elementId}`, { timeout: 10000 });
  } catch (selectorError) {
    throw new Error(`Element with id ${elementId} not found within timeout`);
  }

  const element = await page.$(`#${elementId}`);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  if (!hasCachedScreenshot) {
    const screenshotBuffer = await page.screenshot({ type: "png" });
    screenshot = `data:image/png;base64,${screenshotBuffer.toString("base64")}`;
  }

  if (!hasCachedAccessibilityTree) {
    const elements = await page.$$("[data-number]");
    let result = "";

    for (const el of elements) {
      const [
        dataNumber,
        dataType,
        dataValue,
        dataOptions,
        dataSelected,
        ariaLabel,
      ] = await Promise.all([
        el.getAttribute("data-number"),
        el.getAttribute("data-type"),
        el.getAttribute("data-value"),
        el.getAttribute("data-options"),
        el.getAttribute("data-selected"),
        el.getAttribute("aria-label"),
      ]);

      let elementInfo = `[${dataNumber}] [${dataType}] [${dataValue || ""}]`;

      if (dataOptions) {
        elementInfo += ` [${dataOptions}]`;
        elementInfo += ` Current selection: ${
          dataSelected ? `[${dataSelected}]` : "None"
        }`;
      }

      if (ariaLabel) {
        elementInfo += ` [${ariaLabel}]`;
      }

      result += elementInfo + "\n";
    }

    accessibilityTree = result.trim();
  }

  await page.close();
  await context.close();

  return { screenshot, accessibilityTree };
}
