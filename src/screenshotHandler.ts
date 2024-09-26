import { Request, Response } from "express";
import { chromium } from "playwright";
import { getRedisClient } from "./getRedisClient";

export async function screenshotHandler(request: Request, response: Response) {
  const startTime = Date.now();
  console.log("Starting screenshot and accessibility tree generation");

  const { elementId, url } = request.body;

  console.log("Request body:", request.body);

  console.log("Request:", request);

  console.log("Request Stringified:", JSON.stringify(request, null, 2));

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

  let screenshot = cachedScreenshot;
  let accessibilityTree = cachedAccessibilityTree;

  if (cachedScreenshot && cachedAccessibilityTree) {
    console.log(
      "\n\nCache HIT for screenshot and accessibility tree:\n",
      screenshotCacheKey,
      "\n\n"
    );
  } else {
    console.log(
      "\n\nCache MISS for screenshot or accessibility tree:\n",
      screenshotCacheKey,
      "\n\n"
    );

    try {
      const setupStartTime = Date.now();
      let browser = await chromium.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
      });

      const page = await browser.newPage();

      const urlWithHeadless = new URL(url);
      urlWithHeadless.searchParams.set("headless", "true");

      await page.goto(urlWithHeadless.toString(), {
        waitUntil: "networkidle",
      });

      await page.waitForSelector(`#${elementId}`);

      const element = await page.$(`#${elementId}`);
      if (!element) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      // wait for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const setupEndTime = Date.now();
      console.log(`Setup time: ${setupEndTime - setupStartTime}ms`);

      if (!cachedScreenshot) {
        const screenshotStartTime = Date.now();
        const screenshotBuffer = await element.screenshot({ type: "png" });
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
          const [dataNumber, dataType, dataValue, dataOptions, dataSelected] =
            await Promise.all([
              el.getAttribute("data-number"),
              el.getAttribute("data-type"),
              el.getAttribute("data-value"),
              el.getAttribute("data-options"),
              el.getAttribute("data-selected"),
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
      await browser.close();
    } catch (error) {
      console.error(
        "Error taking screenshot or getting accessibility tree:",
        error
      );
      return response
        .status(500)
        .json({ error: "Failed to take screenshot or get accessibility tree" });
    }
  }

  const endTime = Date.now();
  console.log(`Total execution time: ${endTime - startTime}ms`);

  return response.json({
    screenshot,
    accessibilityTree,
  });
}
