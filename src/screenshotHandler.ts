import { Request, Response } from "express";
import pLimit from "p-limit";
import { Browser, chromium } from "playwright";
import { getRedisClient } from "./getRedisClient.js";

const limitConcurrentPromises = pLimit(5);

let browser: Browser | null = null;

export async function screenshotHandler(request: Request, response: Response) {
  const startTime = Date.now();
  console.log("Starting screenshot and accessibility tree generation");

  const { elementId, url } = request.body;

  console.log("Request body:", request.body);

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
    console.log(
      "\n\nCache HIT for screenshot and accessibility tree:\n",
      screenshotCacheKey,
      "\n\n"
    );
    const endTime = Date.now();
    console.log(`Total execution time (cached): ${endTime - startTime}ms`);
    return response.json({
      screenshot: cachedScreenshot,
      accessibilityTree: cachedAccessibilityTree,
    });
  }

  if (!cachedScreenshot) {
    console.log("\n\nCache MISS for screenshot:\n", screenshotCacheKey);
  }
  if (!cachedAccessibilityTree) {
    console.log(
      "\n\nCache MISS for accessibility tree:\n",
      accessibilityCacheKey
    );
  }

  let screenshot;
  let accessibilityTree;

  try {
    await limitConcurrentPromises(async () => {
      const setupStartTime = Date.now();
      browser =
        browser ||
        (await chromium.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: true,
        }));

      const context = await browser.newContext({
        viewport: { width: 1580, height: 1080 },
      });

      const page = await context.newPage();

      const urlWithHeadless = new URL(url);
      urlWithHeadless.searchParams.set("headless", "true");

      console.log(`Navigating to: ${urlWithHeadless.toString()}`);

      await page.goto(urlWithHeadless.toString(), {
        waitUntil: "networkidle",
        timeout: 30000, // 30 seconds timeout
      });

      console.log(`Waiting for selector: #${elementId}`);
      try {
        await page.waitForSelector(`#${elementId}`, { timeout: 10000 }); // 10 seconds timeout
      } catch (selectorError) {
        console.error(
          `Timeout waiting for selector #${elementId}:`,
          selectorError
        );
        throw new Error(
          `Element with id ${elementId} not found within timeout`
        );
      }

      const element = await page.$(`#${elementId}`);
      if (!element) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      const setupEndTime = Date.now();
      console.log(`Setup time: ${setupEndTime - setupStartTime}ms`);

      if (!cachedScreenshot) {
        const screenshotStartTime = Date.now();
        const screenshotBuffer = await page.screenshot({ type: "png" });
        screenshot = `data:image/png;base64,${screenshotBuffer.toString(
          "base64"
        )}`;
        await redis.set(screenshotCacheKey, screenshot);
        const screenshotEndTime = Date.now();
        console.log(
          `Screenshot time: ${screenshotEndTime - screenshotStartTime}ms`
        );
        console.log(
          "\n\nCache SET for screenshot:\n",
          screenshotCacheKey,
          "\n\n"
        );
      }

      if (!cachedAccessibilityTree) {
        const accessibilityStartTime = Date.now();
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

          let elementInfo = `[${dataNumber}] [${dataType}] [${
            dataValue || ""
          }]`;

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
        await redis.set(accessibilityCacheKey, accessibilityTree);
        const accessibilityEndTime = Date.now();
        console.log(
          `Accessibility tree calculation time: ${
            accessibilityEndTime - accessibilityStartTime
          }ms`
        );
        console.log(
          "\n\nCache SET for accessibility tree:\n",
          accessibilityCacheKey,
          "\n\n"
        );
      }

      await page.close();
      await context.close();
    });
  } catch (error) {
    console.error(
      "Error taking screenshot or getting accessibility tree:",
      error
    );
    await browser?.close(); // Ensure browser is closed in case of error
    return response.status(500).json({
      error: "Failed to take screenshot or get accessibility tree",
      details: (error as Error).message,
    });
  }

  const endTime = Date.now();
  console.log(`Total execution time: ${endTime - startTime}ms`);

  return response.json({
    screenshot,
    accessibilityTree,
  });
}
