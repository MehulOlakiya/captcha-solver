# CAPTCHA Solver - Setup and Usage Guide

## Overview

This is a custom CAPTCHA solver built with Node.js that uses Puppeteer for browser automation and Tesseract.js for Optical Character Recognition (OCR). The solution can automatically solve simple image-based CAPTCHAs without relying on third-party APIs.

## Prerequisites

- **Node.js**: Version 16.0.0 or higher
- **npm**: Latest version
- **Operating System**: Windows, macOS, or Linux

## Installation

1. **Clone or Download the Project**
   ```bash
   mkdir captcha-solver
   cd captcha-solver
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   
   This will install:
   - `puppeteer`: Browser automation library
   - `tesseract.js`: OCR library for text extraction
   - `sharp`: Image processing library

## Usage

### Basic Usage

Run the CAPTCHA solver with:
```bash
npm start
```

Or directly:
```bash
node captcha-solver.js
```

### Expected Output

The script will:
1. Open a browser window
2. Navigate to the CAPTCHA demo page
3. Capture the CAPTCHA image
4. Process the image for better OCR accuracy
5. Extract text using OCR
6. Submit the solution
7. Report the results

Example console output:
```
 Initializing CAPTCHA Solver...
 Navigating to CAPTCHA demo page...
 Successfully loaded the demo page
 CAPTCHA image found
 Capturing CAPTCHA image...
 Original CAPTCHA saved as captcha_original.png
 Preprocessing image for better OCR accuracy...
 Processed CAPTCHA saved as captcha_processed.png
 Extracting text from CAPTCHA using OCR...
OCR Progress: 100%
 Raw OCR output: A B C D 5 6
 Cleaned CAPTCHA text: ABCD56
 Submitting CAPTCHA answer: "ABCD56"
 CAPTCHA text entered successfully
Submit button clicked
 Checking submission result...
 CAPTCHA solved successfully!

 CAPTCHA Solving Summary:
============================
Extracted Text: "ABCD56"
Submission Result: SUCCESS
Message: CAPTCHA solved correctly
============================
```

## Technical Approach

### 1. Browser Automation (Puppeteer)
- Launches a Chromium browser instance
- Navigates to the target CAPTCHA page
- Locates and captures the CAPTCHA image
- Interacts with form elements to submit solutions

### 2. Image Processing (Sharp)
- Converts images to grayscale for better OCR
- Applies noise reduction and sharpening
- Normalizes image contrast
- Resizes images to optimal dimensions for OCR

### 3. Text Extraction (Tesseract.js)
- Uses machine learning OCR to extract text
- Applies character whitelisting for better accuracy
- Uses single-line page segmentation mode
- Cleans extracted text by removing unwanted characters

### 4. Solution Submission
- Automatically fills the CAPTCHA input field
- Submits the form using multiple fallback methods
- Validates the submission result

## Configuration Options

### Headless Mode
To run the browser in headless mode (no GUI), modify the puppeteer launch options:
```javascript
this.browser = await puppeteer.launch({
    headless: true, // Change to true for headless mode
    // ... other options
});
```

### OCR Settings
Fine-tune OCR accuracy by modifying Tesseract options:
```javascript
const { data: { text } } = await Tesseract.recognize(
    imageBuffer,
    'eng',
    {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZz0123456789',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
    }
);
```

## Challenges and Solutions

### 1. Image Quality
**Challenge**: CAPTCHA images often have noise, distortion, or low quality.
**Solution**: Implemented preprocessing pipeline with Sharp library to enhance image quality before OCR.

### 2. OCR Accuracy
**Challenge**: Tesseract may struggle with certain fonts or image qualities.
**Solution**: Applied character whitelisting, optimized page segmentation mode, and image preprocessing.

### 3. Dynamic Page Elements
**Challenge**: CAPTCHA pages may have dynamic loading or changing selectors.
**Solution**: Implemented robust element selection with multiple fallback strategies and timeout handling.

### 4. Anti-Bot Detection
**Challenge**: Some sites may detect automated browsers.
**Solution**: Set realistic user agents and browser flags to minimize detection.

## Troubleshooting

### Common Issues

1. **"CAPTCHA image not found"**
   - The page structure may have changed
   - Try adjusting the image selector in the code
   - Check if the demo page is accessible

2. **OCR returns empty or incorrect text**
   - CAPTCHA may be too complex for basic OCR
   - Try adjusting image preprocessing parameters
   - Check the saved image files for quality

3. **Browser fails to launch**
   - Ensure all dependencies are installed
   - Try running with `--no-sandbox` flag
   - Check if Chromium is properly installed

### Debug Mode

To enable more detailed logging, you can modify the Tesseract logger:
```javascript
logger: m => console.log(m)
```

## Success Rate Expectations

CAPTCHA solving success rates vary significantly based on:
- **CAPTCHA complexity**: Simple text CAPTCHAs: 60-80%, Complex distorted text: 20-40%
- **Image quality**: Higher quality images yield better results
- **Text characteristics**: Clear fonts and high contrast improve accuracy

## Legal and Ethical Considerations

This tool is designed for:
- Educational purposes
- Testing your own applications
- Legitimate automation tasks

**Important**: Ensure you have permission to automate interactions with any website. Respect robots.txt files and terms of service.

## Enhancements and Future Improvements

1. **Machine Learning Integration**: Train custom models for specific CAPTCHA types
2. **Multiple OCR Engines**: Combine results from multiple OCR services
3. **Advanced Image Processing**: Implement noise reduction and character segmentation
4. **Retry Logic**: Add intelligent retry mechanisms for failed attempts
5. **Configuration Management**: External configuration files for different CAPTCHA types

## File Structure

```
captcha-solver/
├── index.js       # Main application script
├── package.json           # Dependencies and configuration
├── captcha_original.png   # Original CAPTCHA image (generated)
├── captcha_processed.png  # Processed image for OCR (generated)
└── README.md             # This documentation
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console output for specific error messages
3. Ensure all dependencies are properly installed
4. Verify Node.js version compatibility