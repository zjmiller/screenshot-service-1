import axios from "axios";

const cacheBustingPrefix = "e1";
let cacheBustingIndex = 0;

// Function to perform a single request and measure its response time
const fetch = async (url) => {
  const startTime = process.hrtime();
  try {
    await axios.post(url, {
      url: `https://web-tasks-delta.vercel.app/store?cb=${cacheBustingPrefix}${cacheBustingIndex++}&state=N4IgxghgTgLiBcBtAugGnAewLYAcMGcBTAUSwgEsAbBUAIwwBMBPBEEdfAV1oCtCw48NuhgZWIAL7owGAHYA3QlHwQY5OfgSJQhMlU1JQ5BqwCMESaiMmhp2petmwktCGNn2b%2FAEEoYABbkijYAZhCURFI6ehFajkIATBYSru6JnuQ%2BfoHBCGERhFEguhSxhm42IADMyamVVRlZAUGEoeGRVsUxBtoVrAAsyZ1pIP32Kegj%2FY2%2Bzbnw%2BR3RpT3xIACstZOV6zPZLW0FRSX6cX1CAGxDaxfjdawXe3Otee2FnSdlvSMA7FvnIB%2BTxyLwWb2O3TOIwAHP8YcCDq8jq4wJwoFBCLIYAAFCAAc0IrHwogxnlR6MxOKgjE4AlxBIQpmkaIxWIAyiTCPTCUIcNSGLSYJp0J82YRoAEAIqcJQsISNADC2Dw%2BHIsjxSKIk3wACVCDhKEw1RqwQVtWz%2FBgAO7GtmyCBgADWtGgmsI6AwUAYSh6rj5NIEYol%2Fm8OAN5FaABUlFhxOh%2FQLA%2BLstGoLH5fH%2BYLVudTEU0gl8zYqkWEP1S%2FB1hWLhWfhXoRWAJwV0wABgmIAT2exSm5CCq6AxBqYpFKNBA9GYcZAXF4%2FEEwhAonEUhnhEo89aSoUPtU6lkAEkbLJOJRKBx15uGNvFMo93Ij76LxuBK1pRAseQ1IQDKBTIz0DbACQASYCGngJlRmA3YIPQR5YMBYDoWAxtGVXIgXxgVo2XIAAvH8aHQy0rQAeS9JQAFlGHCN0OHtJ0XSgCifxUBkMxAeQIytVg1XoAAPTwrWgWRjV%2FCQJCAA%3D%3D`,
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
  const API_URL = "http://localhost:3000/screenshot";
  const numRequestsPerSecond = 8;
  const durationInSeconds = 1; // Adjust the duration as needed

  for (let i = 0; i < durationInSeconds; i++) {
    const responseTimes = await makeRequests(API_URL, numRequestsPerSecond);
    const averageResponseTime =
      responseTimes.reduce((acc, curr) => acc + curr, 0) / responseTimes.length;
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
