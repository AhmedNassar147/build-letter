import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import generateAcceptanceLetterHtml from "./generateAcceptanceLetterHtml.mjs";
import generateFolderIfNotExisting from "./generateFolderIfNotExisting.mjs";

// __dirname fix for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null, // Allow full window resizing
    args: ["--start-maximized"], // Maximize window on launch
  }); // visible browser for interaction
  const page = await browser.newPage();

  const desktopPath = path.join(process.env.USERPROFILE, "Desktop");

  console.log("desktopPath", desktopPath);

  await Promise.all([
    generateFolderIfNotExisting(`${desktopPath}/acceptance`),
    generateFolderIfNotExisting(`${desktopPath}/rejection`),
  ]);

  // Expose a Node function to the page to generate PDF
  await page.exposeFunction("generatePdfFromForm", async (formData) => {
    // formData contains all your fields as strings/booleans
    // generate the HTML

    const isRejection = !!formData.isRejection;

    const htmlContent = generateAcceptanceLetterHtml({
      requestDate: formData.requestDate,
      referralId: formData.referralId,
      patientName: formData.patientName,
      nationalId: formData.nationalId,
      specialty: formData.specialty,
      subSpecialty: formData.subSpecialty,
      sourceProvider: formData.sourceProvider,
      nationality: formData.nationality,
      bedType: formData.bedType,
      mobileNumber: formData.mobileNumber,
      isRejection: isRejection,
    });

    // Create a new page to render the letter HTML
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(htmlContent, { waitUntil: "networkidle0" });
    await pdfPage.bringToFront();

    const fileName = `letter_${formData.referralId}.pdf`;

    const folderName = isRejection ? "rejection" : "acceptance";

    const outputPath = path.resolve(desktopPath, folderName, fileName);

    await pdfPage.pdf({
      path: outputPath,
      format: "A4",
      // Avoid printBackground: true unless absolutely necessary — it increases size significantly
      printBackground: false,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
      scale: 1,
    });

    await pdfPage.close();

    return outputPath;
  });

  // Load the form.html page (adjust path accordingly)
  const formPath = `file://${path.resolve(__dirname, "form.html")}`;
  await page.goto(formPath);

  // Keep browser open for user interaction
  // Optionally, you can close it automatically or add a timer if you want
}

main().catch(console.error);
