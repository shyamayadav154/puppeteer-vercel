const app = require("express")();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.get("/api", async (req, res) => {
  let options = {};
  const link = "https://mevvit.com/r/amitb";

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    const browser = await puppeteer.launch(options);

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(link, { waitUntil: "networkidle2" });
    // retry if 404
    if (page.url().includes("404")) {
      await page.goto(link, { waitUntil: "networkidle2" });
    }
    const screenshot = await page.screenshot({
      type: "jpeg",
      clip: { x: 240, y: 20, width: 900, height: 600 },
    });
    await browser.close();

    res.set("Content-Type", "image/jpeg");
    res.send(screenshot);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
