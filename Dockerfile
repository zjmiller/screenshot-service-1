FROM mcr.microsoft.com/playwright:v1.47.2-noble as base

WORKDIR /app

COPY . /app

WORKDIR /app/screenshot-service-1

COPY .env .env

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl --fail -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{"elementId": "task-container", "url": "https://web-tasks-delta.vercel.app/agent?state=N4IgxghgTgLiBcBtAugGnAewLYAcMGcBTAUSwgEsAbBUAIwwBMBPBEEdfAV1oCtCw48NuhgZWIAL7owGAHYA3QlHwQY5OfgSJQhMlU1JQ5BqwCMESaiMmhp2petmwktCGNn2b%2FAEEoYABbkijYAZhCURFI6ehFajkIATBYSru6JnuQ%2BfoHBCGERhFEguhSxhm42IADMyamVVRlZAUGEoeGRVsUxBtoVrAAsyZ1pIP32Kegj%2FY2%2Bzbnw%2BR3RpT3xIACstZOV6zPZLW0FRSX6cX1CAGxDaxfjdawXe3Otee2FnSdlvSMA7FvnIB%2BTxyLwWb2O3TOIwAHP8YcCDq8jq4wJwoFBCLIYAAFCAAc0IrHwogxnlR6MxOKgjE4AlxBIQpmkaIxWIAyiTCPTCUIcNSGLSYJp0J82YRoAEAIqcJQsISNADC2Dw%2BHIsjxSKIk3wACVCDhKEw1RqwQVtWz%2FBgAO7GtmyCBgADWtGgmsI6AwUAYSh6rj5NIEYol%2Fm8OAN5FaABUlFhxOh%2FQLA%2BLstGoLH5fH%2BYL8NilNyEFV0BiDUxSKUaCB6Mw4yAuLx%2BIJhCBROIpLXCJQG60FapCHjPXLZJxKJQOB2uwwlQofap1LIAJI2IcjsedgTduSKZSzuSL32rifSiBY8hqQgGYBtohrmCtNnkABe55oV8tVoA8l6lABZRjhN0cPaToulA37nioDIZiA8gRlarBqvQAAenhWtAsjGheEgSEAA"}'