import { Request, Response } from "express";
import { Browser, chromium } from "playwright";

let localBrowser: Browser | null = null;
let localBrowserContextsInUse = 0;

export async function screenshotHandler(request: Request, response: Response) {
  const startTime = Date.now();
  const { elementId, url } = request.body;

  if (!elementId || !url) {
    return response
      .status(400)
      .json({ error: "Element ID and URL are required" });
  }

  let screenshot;
  let accessibilityTree;
  let browser: Browser | null = null;
  let isUsingLocalBrowser = false;

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

    const result = await useBrowser(browser, url, elementId);
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

    const endTime = Date.now();
    console.log(
      `Error occurred. Total response time: ${endTime - startTime}ms`
    );

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

  const endTime = Date.now();
  console.log(
    `Using ${
      isUsingLocalBrowser ? "local browser" : "browserless"
    }. Total response time: ${endTime - startTime}ms`
  );

  return response.json({
    screenshot,
    accessibilityTree,
    didUseBrowserless: !isUsingLocalBrowser,
  });
}

async function useBrowser(browser: Browser, url: string, elementId: string) {
  let screenshot: string | undefined;
  let accessibilityTree: string | undefined;

  const context = await browser.newContext({
    viewport: { width: 1580, height: 1280 },
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

  const screenshotBuffer = await page.screenshot({ type: "png" });
  screenshot = `data:image/png;base64,${screenshotBuffer.toString("base64")}`;

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

  await page.close();
  await context.close();

  return { screenshot, accessibilityTree };
}
