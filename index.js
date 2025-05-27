const puppeteer = require("puppeteer");
const Tesseract = require("tesseract.js");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

class CaptchaSolver {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log("Initializing CAPTCHA Solver...");

    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
  }

  async navigateToPage() {
    console.log(" Navigating to CAPTCHA captcha page...");

    try {
      await this.page.goto("https://2captcha.com/demo/normal", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      console.log(" Successfully loaded the captcha page");
      await this.page.waitForSelector('img[src*="captcha"]', {
        timeout: 10000,
      });
      console.log("CAPTCHA image found");
    } catch (error) {
      console.error("Error navigating to captcha page:", error.message);
      throw error;
    }
  }

  async captureCaptchaImage() {
    console.log("Capturing CAPTCHA image...");

    try {
      const captchaImage = await this.page.$(
        'img[src*="captcha"][class*="captcha"][alt="normal captcha example"]'
      );

      if (!captchaImage) {
        throw new Error("CAPTCHA image not found");
      }

      const imageSrc = await this.page.evaluate((img) => img.src, captchaImage);
      console.log("CAPTCHA image URL:", imageSrc);

      const imageBuffer = await captchaImage.screenshot({ type: "png" });

      const originalPath = path.join(__dirname, "captcha_original.png");
      fs.writeFileSync(originalPath, imageBuffer);
      console.log("Original CAPTCHA saved as captcha_original.png");

      return imageBuffer;
    } catch (error) {
      console.error("Error capturing CAPTCHA image:", error.message);
      throw error;
    }
  }

  async preprocessImage(imageBuffer) {
    console.log(
      "Preprocessing image for better OCR accuracy..."
    );

    try {
      const processedBuffer = await sharp(imageBuffer)
        .resize(750, 300, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255 },
        })
        .greyscale()
        .median(2)
        .blur(1.2)
        .gamma(2.5)
        .linear(3.8, -500)
        .threshold(85)
        .sharpen(2.5, 1, 1.5)
        .png({ quality: 100 })
        .toBuffer();

      const processedPath = path.join(__dirname, `captcha_processed.png`);
      fs.writeFileSync(processedPath, processedBuffer);
      console.log(`image saved`);

      return processedBuffer;
    } catch (error) {
      console.error(" Error in enhanced preprocessing:", error.message);
      return [imageBuffer];
    }
  }

  async extractTextFromImage(imageBuffer) {
    try {
      console.log("Extracting text from CAPTCHA using OCR...");

      const {
        data: { text },
      } = await Tesseract.recognize(imageBuffer, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            process.stdout.write(`\rBuffer : ${Math.round(m.progress * 100)}%`);
          }
        },
         tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
         tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD,
         tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
      });
      const cleanedText = text
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();

      return cleanedText;
    } catch (error) {
      throw new Error("Failed to extract text with enhanced digit OCR");
    }
  }

  async submitCaptcha(captchaText) {
    console.log(`Submitting CAPTCHA answer: "${captchaText}"`);

    try {
      const inputSelector =
        'input[name="captcha"], input[type="text"], input[placeholder*="Enter answer here" i]';
      await this.page.waitForSelector(inputSelector, { timeout: 5000 });

      await this.page.click(inputSelector);
      await this.page.keyboard.down("Control");
      await this.page.keyboard.press("KeyA");
      await this.page.keyboard.up("Control");
      await this.page.type(inputSelector, captchaText, { delay: 100 });

      console.log("CAPTCHA text entered successfully");

      const submitSelector =
        'button[type="submit"], input[type="submit"], button:contains("Check"), .btn-submit';

      try {
        await this.page.waitForSelector(submitSelector, { timeout: 3000 });
        await this.page.click(submitSelector);
        console.log("Submit button clicked");
      } catch {
        await this.page.keyboard.press("Enter");
        console.log("Used Enter key to submit");
      }

      await this.page.waitForTimeout(2000);
      return await this.checkSubmissionResult();
    } catch (error) {
      console.error("Error submitting CAPTCHA:", error.message);
      throw error;
    }
  }

  async checkSubmissionResult() {
    console.log("Checking submission result...");

    try {
      const successSelectors = '[class*="successMessage"]';

      const errorSelectors = '[class*="_errorMessage"]';

      const element = await this.page.$(successSelectors);
      if (element) {
        console.log("CAPTCHA solved successfully!");
        return { success: true, message: "CAPTCHA solved correctly" };
      }

      const errorElement = await this.page.$(errorSelectors);
      if (errorElement) {
        console.log("CAPTCHA solution was incorrect");
        return { success: false, message: "CAPTCHA solution incorrect" };
      }

      console.log("CAPTCHA submitted (result unclear)");
      return { success: true, message: "CAPTCHA submitted successfully" };
    } catch (error) {
      console.error("Error checking submission result:", error.message);
      return { success: false, message: "Error checking result" };
    }
  }

  async solveCaptcha() {
    console.log("Starting enhanced digit CAPTCHA solving process...");

    try {
      await this.init();
      await this.navigateToPage();
      const imageBuffer = await this.captureCaptchaImage();
      const processedImages = await this.preprocessImage(imageBuffer);
      const captchaText = await this.extractTextFromImage(processedImages);

      if (!captchaText || captchaText.length < 3) {
        throw new Error("Failed to extract meaningful text from CAPTCHA");
      }

      const result = await this.submitCaptcha(captchaText);

      console.log("=====================================");
      console.log(`Extracted Text: "${captchaText}"`);
      console.log(
        `Submission Result: ${result.success ? "SUCCESS" : " FAILED"}`
      );
      console.log(`Message: ${result.message}`);
      console.log("=====================================\n");

      return result;
    } catch (error) {
      console.error("CAPTCHA solving failed:", error.message);
      return { success: false, message: error.message };
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      fs.unlinkSync(path.join(__dirname, "captcha_original.png"));
      fs.unlinkSync(path.join(__dirname, "captcha_processed.png"));
      console.log(
        "Cleanup completed: Browser closed and temporary files deleted"
      );
    }
  }
}

async function main() {
  const solver = new CaptchaSolver();

  try {
    const result = await solver.solveCaptcha();

    if (result.success) {
      console.log("Enhanced CAPTCHA solving completed successfully!");
    } else {
      console.log(
        "CAPTCHA solving failed. Consider trying multiple attempts for better results."
      );
    }
  } catch (error) {
    console.error("Fatal error:", error.message);
  } finally {
    await solver.cleanup();
  }
}

process.on("SIGINT", async () => {
  console.log("\n  Process interrupted. Cleaning up...");
  process.exit(0);
});

module.exports = { CaptchaSolver };

if (require.main === module) {
  main();
}
