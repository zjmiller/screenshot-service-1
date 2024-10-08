import axios from "axios";

const cacheBustingPrefix = "b5";
let cacheBustingIndex = 0;

// Function to perform a single request and measure its response time
const fetch = async (url) => {
  const startTime = process.hrtime();
  try {
    await axios.post(url, {
      url: `https://web-tasks-delta.vercel.app/store?cb=${cacheBustingPrefix}z${cacheBustingIndex++}&state=N4IgxghgTgLiBcBtAugGnAewLYAcMGcBTAUSwgEsAbBUAIwwBMBPBEEdfAV1oCtCw48NuhgZWIAL7owGAHYA3QlHwQY5OfgSJQhMlU1JQ5BqwCMESaiMmhp2petmwktCGNn2b%2FAEEoYABbkijYAZhCURFI6ehFajkIATBYSru6JnuQ%2BfoHBCGERhFEguhSxhm42IADMyamVVRlZAUGEoeGRVsUxBtoVrAAsyZ1pIP32Kegj%2FY2%2Bzbnw%2BR3RpT3xIACstZOV6zPZLW0FRSX6cX1CAGxDaxfjdawXe3Otee2FnSdlvSMA7FvnIB%2BTxyLwWb2O3TOIwAHP8YcCDq8jq4wJwoFBCLIYAAFCAAc0IrHwogxnlR6MxOKgjE4AlxBIQpmkaIxWIAyiTCPTCUIcNSGLSYJp0J82YRoAEAIqcJQsISNADC2Dw%2BHIsjxSKIk3wACVCDhKEw1RqwQVtWz%2FBgAO7GtmyCBgADWtGgmsI6AwUAYSh6rj5NIEYol%2Fm8OAN5FaABUlFhxOh%2FQLA%2BLstGoLH5fH%2BYLVudTEU0gl8zYqkWEP1S%2FB1hWLhWfhXoRWAJwV0wABgmIAT2exSm5CCq6AxBqYpFKNBA9GYcZAXF4%2FEEwhAonEUhnhEo89aSoUPtU6lkAEkbLJOJRKBx15uGNvFMo93Ij76LxuBK1pRAseQ1IQDKBTIz0DbACQASYCGngJlRmA3YIPQR5YMBYDoWAxtGVXIgXxgVo2XIAAvH8aHQy0rQAeS9JQAFlGHCN0OHtJ0XSgCifxUBkMxAeQIytVg1XoAAPTwrWgWRjV%2FCQJCAA%3D%3D`,
      elementId: "task-container",
    });
    const diff = process.hrtime(startTime);
    const responseTime = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds
    return responseTime;
  } catch (error) {
    console.error("Request failed:", error.message);
    return null;
  }
};

// Function to handle multiple requests concurrently
const makeRequests = async (url, numRequests) => {
  const requests = [];
  for (let i = 0; i < numRequests; i++) {
    requests.push(fetch(url));
  }
  const responseTimes = await Promise.all(requests);
  return responseTimes.filter((time) => time !== null);
};

// Main function to run the test
const main = async () => {
  // const API_URL = "https://screenshot-service.duckdns.org/screenshot";
  const API_URL = "http://localhost:3000/screenshot";
  const numRequestsPerSecond = 20;
  const durationInSeconds = 1; // Adjust the duration as needed

  // 3,4 = 6.5-7.5 seconds response
  // 3,4 = almost 3 seconds response (Basic Regular Intel 8 vCPUs 16 GB 10 GB 6 TB $96/mo $0.143/hr)
  // 3,4 = 3-3.5 seconds response (Memory-Optimized Premium Intel 2 vCPUs 16 GB 10 GB 4 TB $99/mo $0.147/hr)
  // 3,4 = 2.4 seconds response (CPU-Optimized Premium Intel 4 vCPUs 8 GB 10 GB 5 TB $109/mo $0.162/hr)
  // CHEAPEST CPU-OPTIMIZED 3,4 = high 3 low 4 (CPU-Optimized Regular Intel 2 vCPUs 4 GB 10 GB 4 TB $42/mo $0.063/hr)
  // $218/mo CPU-OPTIMIZED 3,4 = just below 2s

  // 8,3 =
  // 8,3 = 5-7s (Basic)
  // 8,3 = 8-8.5s (Memory-Optimized)
  // 8,3 = 3.5-4.5s (CPU-Optimized)
  // CHEAPEST CPU-OPTIMIZED 8,3 = 10-11s (CPU-Optimized Regular Intel 2 vCPUs 4 GB 10 GB 4 TB $42/mo $0.063/hr)
  // $218/mo CPU-OPTIMIZED 8,3 = 3.3-3.4

  // 12,3 $109/mo CPU-OPTIMIZED = 6-7s
  // 15,3 $109/mo CPU-OPTIMIZED = 8s
  // 18,3 $109/mo CPU-OPTIMIZED = 9.5-10s
  // 20,3 $109/mo CPU-OPTIMIZED = 11s

  for (let i = 0; i < durationInSeconds; i++) {
    const responseTimes = await makeRequests(API_URL, numRequestsPerSecond);
    const averageResponseTime =
      responseTimes.reduce((acc, curr) => acc + curr, 0) / responseTimes.length;
    console.log(
      `Response Times for second ${i + 1}:`,
      responseTimes.map((time) => (time / 1000).toFixed(1)).join(", ")
    );
    console.log(
      `Average Response Time for second ${i + 1}: ${averageResponseTime.toFixed(
        4
      )} ms`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before the next set of requests
  }
};

// Start the load test
main();
